from django.db import models
from django.contrib.auth.models import User

class Question(models.Model):
    question_text = models.TextField()
    options = models.JSONField(help_text="Array of strings")
    correct_answer_index = models.PositiveIntegerField()
    explanation = models.TextField()
    species = models.JSONField(help_text="List of targeted species")
    system = models.CharField(max_length=100)
    creator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    source_document = models.ForeignKey('library.Document', on_delete=models.SET_NULL, null=True, blank=True, related_name='questions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.question_text[:50]

class QuizAttempt(models.Model):
    user = models.ForeignKey(User, related_name='quiz_attempts', on_delete=models.CASCADE)
    score = models.IntegerField()
    total_questions = models.IntegerField()
    correct_count = models.IntegerField()
    system = models.CharField(max_length=100, blank=True, null=True)
    species = models.CharField(max_length=100, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    quiz_config = models.JSONField(default=dict, blank=True, help_text="Store settings like timer, mode, etc.")

    def __str__(self):
        return f"{self.user.username} - {self.score}/{self.total_questions} ({self.timestamp})"

class CompletedPracticeQuestion(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    was_correct = models.BooleanField()
    attempted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-attempted_at']

    def __str__(self):
        return f"{self.user.username} - {self.question.id} - {self.was_correct}"
