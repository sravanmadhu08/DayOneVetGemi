from rest_framework import viewsets, permissions
from rest_framework.exceptions import ValidationError
from django.db.models import Q
from .models import Flashcard, FlashcardProgress, MAX_CUSTOM_FLASHCARDS_PER_USER
from .serializers import FlashcardSerializer, FlashcardProgressSerializer
from core.permissions import IsAdminOrReadOnly, IsOwner

class FlashcardViewSet(viewsets.ModelViewSet):
    queryset = Flashcard.objects.all()
    serializer_class = FlashcardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Normal users can see all global flashcards + their own
        limit = self.request.query_params.get('limit')
        if self.request.user.is_staff:
            queryset = Flashcard.objects.select_related('creator')
        else:
            queryset = Flashcard.objects.select_related('creator').filter(
                Q(creator__isnull=True) | Q(creator=self.request.user)
            )
        if limit and limit.isdigit():
            return queryset[:int(limit)]
        return queryset

    def perform_create(self, serializer):
        if not self.request.user.is_staff:
            custom_count = Flashcard.objects.filter(creator=self.request.user).count()
            if custom_count >= MAX_CUSTOM_FLASHCARDS_PER_USER:
                raise ValidationError({
                    "detail": (
                        "Custom flashcard limit reached. "
                        f"Normal users can create up to {MAX_CUSTOM_FLASHCARDS_PER_USER} custom flashcards."
                    )
                })
        serializer.save(creator=self.request.user)

class FlashcardProgressViewSet(viewsets.ModelViewSet):
    queryset = FlashcardProgress.objects.all()
    serializer_class = FlashcardProgressSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        queryset = FlashcardProgress.objects.select_related('user', 'flashcard')
        if self.request.user.is_staff:
            return queryset
        return queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
