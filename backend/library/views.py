from rest_framework import viewsets, permissions
from django.db.models import Q
from .models import Document, Guideline, Resource
from .serializers import DocumentSerializer, GuidelineSerializer, ResourceSerializer
from core.permissions import IsAdminOrReadOnly, IsOwner

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Document.objects.all()
        return Document.objects.filter(Q(creator__isnull=True) | Q(creator=self.request.user))

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

class GuidelineViewSet(viewsets.ModelViewSet):
    queryset = Guideline.objects.all()
    serializer_class = GuidelineSerializer
    permission_classes = [IsAdminOrReadOnly]

class ResourceViewSet(viewsets.ModelViewSet):
    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer
    permission_classes = [IsAdminOrReadOnly]
