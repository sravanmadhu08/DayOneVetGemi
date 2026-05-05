from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.db.models import Q
from django.utils import timezone
from .models import Flashcard, FlashcardProgress, MAX_CUSTOM_FLASHCARDS_PER_USER
from .serializers import FlashcardSerializer, FlashcardProgressSerializer
from core.permissions import IsAdminOrReadOnly, IsOwner

class FlashcardViewSet(viewsets.ModelViewSet):
    queryset = Flashcard.objects.all()
    serializer_class = FlashcardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Normal users can see all global flashcards + their own
        if self.request.user.is_staff:
            return Flashcard.objects.select_related('creator')
        return Flashcard.objects.select_related('creator').filter(
            Q(creator__isnull=True) | Q(creator=self.request.user)
        )

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

    @action(detail=False, methods=['get'])
    def due(self, request):
        if request.user.is_staff:
            visible_cards = Flashcard.objects.select_related('creator')
        else:
            visible_cards = Flashcard.objects.select_related('creator').filter(
                Q(creator__isnull=True) | Q(creator=request.user)
            )

        reviewed = FlashcardProgress.objects.filter(user=request.user).values('flashcard_id')
        due_progress = FlashcardProgress.objects.filter(
            user=request.user,
            flashcard_id__in=visible_cards.values('id'),
            next_review__lte=timezone.now(),
        ).values('flashcard_id')

        queryset = visible_cards.filter(Q(id__in=due_progress) | ~Q(id__in=reviewed))

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(self.add_progress_data(serializer.data))

        serializer = self.get_serializer(queryset, many=True)
        return Response(self.add_progress_data(serializer.data))

    def add_progress_data(self, cards):
        card_ids = [card['id'] for card in cards]
        progress_by_card = {
            progress.flashcard_id: progress
            for progress in FlashcardProgress.objects.filter(
                user=self.request.user,
                flashcard_id__in=card_ids,
            )
        }

        for card in cards:
            progress = progress_by_card.get(card['id'])
            card['progress'] = {
                'id': progress.id,
                'flashcard': progress.flashcard_id,
                'interval': progress.interval,
                'ease': progress.ease,
                'next_review': progress.next_review,
                'last_reviewed': progress.last_reviewed,
                'consecutive_correct': progress.consecutive_correct,
            } if progress else None
        return cards

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
