from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from .models import UserProfile, GlobalSetting
from .serializers import UserProfileSerializer, GlobalSettingSerializer, RegisterSerializer, GoogleLoginSerializer
from core.permissions import IsAdminOrReadOnly, IsOwner

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

class GoogleLoginView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        if not settings.GOOGLE_CLIENT_ID:
            raise ImproperlyConfigured(
                "GOOGLE_CLIENT_ID must be set to use Google Sign-In."
            )

        serializer = GoogleLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        credential = serializer.validated_data["credential"]

        try:
            idinfo = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
        except ValueError:
            return Response(
                {"detail": "Invalid Google credential."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        issuer = idinfo.get("iss")
        email = idinfo.get("email")
        email_verified = idinfo.get("email_verified")
        google_sub = idinfo.get("sub")

        if idinfo.get("aud") != settings.GOOGLE_CLIENT_ID:
            return Response({"detail": "Invalid Google token audience."}, status=status.HTTP_400_BAD_REQUEST)
        if issuer not in ("accounts.google.com", "https://accounts.google.com"):
            return Response({"detail": "Invalid Google token issuer."}, status=status.HTTP_400_BAD_REQUEST)
        if not email:
            return Response({"detail": "Google account did not provide an email."}, status=status.HTTP_400_BAD_REQUEST)
        if email_verified is not True:
            return Response({"detail": "Google email must be verified."}, status=status.HTTP_400_BAD_REQUEST)
        if not google_sub:
            return Response({"detail": "Google account identifier is missing."}, status=status.HTTP_400_BAD_REQUEST)

        name = idinfo.get("name") or ""
        picture = idinfo.get("picture") or ""

        with transaction.atomic():
            profile = UserProfile.objects.select_related("user").filter(google_sub=google_sub).first()
            if profile:
                user = profile.user
            else:
                user = User.objects.filter(email__iexact=email).first()
                if not user:
                    user = User.objects.create_user(
                        username=email,
                        email=email,
                        first_name=name,
                    )
                profile, _ = UserProfile.objects.get_or_create(user=user)
                profile.google_sub = google_sub

            changed = []
            if picture and profile.photo_url != picture:
                profile.photo_url = picture
                changed.append("photo_url")
            if profile.google_sub != google_sub:
                profile.google_sub = google_sub
                changed.append("google_sub")
            if changed:
                profile.save(update_fields=[*changed, "updated_at"])

            if name and user.first_name != name:
                user.first_name = name
                user.save(update_fields=["first_name"])

        refresh = RefreshToken.for_user(user)
        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": {
                "email": user.email,
                "displayName": user.first_name,
                "photoURL": profile.photo_url,
            },
        })

class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        if self.request.user.is_staff or (getattr(self.request.user, 'profile', None) and self.request.user.profile.is_admin):
            return UserProfile.objects.all()
        return UserProfile.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get', 'patch'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        if request.method == 'GET':
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        elif request.method == 'PATCH':
            serializer = self.get_serializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

class GlobalSettingViewSet(viewsets.ModelViewSet):
    queryset = GlobalSetting.objects.all()
    serializer_class = GlobalSettingSerializer
    lookup_field = 'key'

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsAdminOrReadOnly()]
