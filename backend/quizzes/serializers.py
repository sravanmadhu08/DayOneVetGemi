from rest_framework import serializers
from .models import Question, QuizAttempt, CompletedPracticeQuestion

class QuestionSerializer(serializers.ModelSerializer):
    question = serializers.CharField(source='question_text')
    correctAnswer = serializers.IntegerField(source='correct_answer_index')

    class Meta:
        model = Question
        fields = ['id', 'question', 'question_text', 'options', 'correctAnswer', 'correct_answer_index', 'explanation', 'species', 'system', 'creator', 'created_at', 'updated_at']
        read_only_fields = ['creator', 'created_at', 'updated_at']
        extra_kwargs = {
            'question_text': {'write_only': True},
            'correct_answer_index': {'write_only': True}
        }

class QuizAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAttempt
        fields = '__all__'
        read_only_fields = ['user', 'timestamp']

class CompletedPracticeQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompletedPracticeQuestion
        fields = '__all__'
        read_only_fields = ['user', 'attempted_at']
