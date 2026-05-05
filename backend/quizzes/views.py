from rest_framework import viewsets, permissions
from .models import Question, QuizAttempt, CompletedPracticeQuestion
from .serializers import QuestionSerializer, QuizAttemptSerializer, CompletedPracticeQuestionSerializer
from core.permissions import IsAdminOrReadOnly, IsOwner

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [IsAdminOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

class QuizAttemptViewSet(viewsets.ModelViewSet):
    queryset = QuizAttempt.objects.all()
    serializer_class = QuizAttemptSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        if self.request.user.is_staff:
            return QuizAttempt.objects.all()
        return QuizAttempt.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class CompletedPracticeQuestionViewSet(viewsets.ModelViewSet):
    queryset = CompletedPracticeQuestion.objects.all()
    serializer_class = CompletedPracticeQuestionSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        if self.request.user.is_staff:
            return CompletedPracticeQuestion.objects.all()
        return CompletedPracticeQuestion.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
