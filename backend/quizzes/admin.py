from django.contrib import admin
from .models import Question, QuizAttempt, CompletedPracticeQuestion

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('question_text', 'system', 'created_at')
    list_filter = ('system',)
    search_fields = ('question_text', 'explanation')

@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ('user', 'score', 'total_questions', 'timestamp')
    list_filter = ('timestamp', 'user')
    search_fields = ('user__username', 'system', 'species')

@admin.register(CompletedPracticeQuestion)
class CompletedPracticeQuestionAdmin(admin.ModelAdmin):
    list_display = ('user', 'question', 'was_correct', 'attempted_at')
    list_filter = ('was_correct', 'attempted_at')
    search_fields = ('user__username', 'question__question_text')
