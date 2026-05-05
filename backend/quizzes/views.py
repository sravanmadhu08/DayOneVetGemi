from rest_framework import status, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from django.db import transaction
from .models import Question, QuizAttempt, CompletedPracticeQuestion, BookmarkedQuestion
from .serializers import (
    QuestionSerializer,
    QuizAttemptSerializer,
    CompletedPracticeQuestionSerializer,
    BookmarkedQuestionSerializer,
    BulkQuestionImportSerializer,
)
from core.permissions import IsAdminOrReadOnly, IsOwner

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.select_related('creator', 'source_document')
    serializer_class = QuestionSerializer
    permission_classes = [IsAdminOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    @action(detail=False, methods=['post'], url_path='bulk-import', permission_classes=[permissions.IsAuthenticated])
    def bulk_import(self, request):
        user = request.user
        profile = getattr(user, 'profile', None)
        if not (user.is_staff or (profile and profile.is_admin)):
            return Response(
                {"detail": "Only admin users can bulk import questions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        payload = request.data
        if isinstance(payload, list):
            rows = payload
            dry_run = False
            skip_duplicates = False
        elif isinstance(payload, dict):
            rows = payload.get("questions")
            dry_run = bool(payload.get("dry_run", False))
            skip_duplicates = bool(payload.get("skip_duplicates", False))
        else:
            return Response(
                {"detail": "Expected a JSON array or an object with a questions array."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(rows, list):
            return Response(
                {"detail": "questions must be a list."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        errors = []
        question_kwargs = []
        for index, row in enumerate(rows):
            serializer = BulkQuestionImportSerializer(data=row)
            if serializer.is_valid():
                question_kwargs.append(serializer.to_question_kwargs())
            else:
                errors.append({"index": index, "errors": serializer.errors})

        if errors:
            return Response({
                "created_count": 0,
                "skipped_count": 0,
                "error_count": len(errors),
                "created_ids": [],
                "skipped": [],
                "errors": errors,
            }, status=status.HTTP_400_BAD_REQUEST)

        skipped = []
        existing_texts = set()
        if skip_duplicates and question_kwargs:
            existing_texts = set(Question.objects.filter(
                question_text__in=[item["question_text"] for item in question_kwargs]
            ).values_list("question_text", flat=True))

        to_create = []
        for index, item in enumerate(question_kwargs):
            if skip_duplicates and item["question_text"] in existing_texts:
                skipped.append({
                    "index": index,
                    "text": item["question_text"],
                    "reason": "duplicate question_text",
                })
                continue
            to_create.append(Question(creator=user, **item))

        if dry_run:
            return Response({
                "created_count": len(to_create),
                "skipped_count": len(skipped),
                "error_count": 0,
                "created_ids": [],
                "skipped": skipped,
                "errors": [],
            })

        with transaction.atomic():
            created = Question.objects.bulk_create(to_create)

        return Response({
            "created_count": len(created),
            "skipped_count": len(skipped),
            "error_count": 0,
            "created_ids": [question.id for question in created],
            "skipped": skipped,
            "errors": [],
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post', 'delete'], permission_classes=[permissions.IsAuthenticated])
    def bookmark(self, request, pk=None):
        question = self.get_object()

        if request.method == 'POST':
            bookmark, created = BookmarkedQuestion.objects.get_or_create(
                user=request.user,
                question=question,
            )
            serializer = BookmarkedQuestionSerializer(
                bookmark,
                context={'request': request},
            )
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
            )

        BookmarkedQuestion.objects.filter(
            user=request.user,
            question=question,
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class BookmarkedQuestionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BookmarkedQuestionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return BookmarkedQuestion.objects.select_related(
            'question',
            'user',
            'question__creator',
            'question__source_document',
        ).filter(user=self.request.user)

class QuizAttemptViewSet(viewsets.ModelViewSet):
    queryset = QuizAttempt.objects.all()
    serializer_class = QuizAttemptSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        limit = self.request.query_params.get('limit')
        queryset = QuizAttempt.objects.select_related('user').order_by('-timestamp')
        if self.request.user.is_staff:
            return queryset[:int(limit)] if limit and limit.isdigit() else queryset
        queryset = queryset.filter(user=self.request.user)
        return queryset[:int(limit)] if limit and limit.isdigit() else queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class CompletedPracticeQuestionViewSet(viewsets.ModelViewSet):
    queryset = CompletedPracticeQuestion.objects.all()
    serializer_class = CompletedPracticeQuestionSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        queryset = CompletedPracticeQuestion.objects.select_related('user', 'question')
        limit = self.request.query_params.get('limit')
        if self.request.user.is_staff:
            return queryset[:int(limit)] if limit and limit.isdigit() else queryset
        queryset = queryset.filter(user=self.request.user)
        return queryset[:int(limit)] if limit and limit.isdigit() else queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
