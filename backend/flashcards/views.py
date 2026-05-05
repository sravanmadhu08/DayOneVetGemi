from rest_framework import viewsets, permissions
from django.db.models import Q
from .models import Flashcard, FlashcardProgress
from .serializers import FlashcardSerializer, FlashcardProgressSerializer
from core.permissions import IsAdminOrReadOnly, IsOwner

class FlashcardViewSet(viewsets.ModelViewSet):
    queryset = Flashcard.objects.all()
    serializer_class = FlashcardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Normal users can see all global flashcards + their own
        if self.request.user.is_staff:
            return Flashcard.objects.all()
        return Flashcard.objects.filter(Q(creator__isnull=True) | Q(creator=self.request.user))

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

class FlashcardProgressViewSet(viewsets.ModelViewSet):
    queryset = FlashcardProgress.objects.all()
    serializer_class = FlashcardProgressSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        if self.request.user.is_staff:
            return FlashcardProgress.objects.all()
        return FlashcardProgress.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
