from rest_framework import status, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from .models import Question, QuizAttempt, CompletedPracticeQuestion, BookmarkedQuestion
from .serializers import QuestionSerializer, QuizAttemptSerializer, CompletedPracticeQuestionSerializer, BookmarkedQuestionSerializer
from core.permissions import IsAdminOrReadOnly, IsOwner

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.select_related('creator', 'source_document')
    serializer_class = QuestionSerializer
    permission_classes = [IsAdminOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

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
