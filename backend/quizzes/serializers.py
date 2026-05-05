import json

from rest_framework import serializers
from .models import Question, QuizAttempt, CompletedPracticeQuestion, BookmarkedQuestion

class QuestionSerializer(serializers.ModelSerializer):
    question = serializers.CharField(source='question_text')
    correctAnswer = serializers.IntegerField(source='correct_answer_index')
    image_url = serializers.SerializerMethodField()
    isBookmarked = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = ['id', 'question', 'question_text', 'options', 'correctAnswer', 'correct_answer_index', 'explanation', 'species', 'system', 'image', 'image_url', 'isBookmarked', 'creator', 'created_at', 'updated_at']
        read_only_fields = ['creator', 'created_at', 'updated_at']
        extra_kwargs = {
            'question_text': {'write_only': True, 'required': False},
            'correct_answer_index': {'write_only': True, 'required': False},
            'image': {'required': False, 'allow_null': True}
        }

    def get_image_url(self, obj):
        if not obj.image:
            return None

        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url

    def get_isBookmarked(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return BookmarkedQuestion.objects.filter(
            user=request.user,
            question=obj,
        ).exists()

    def validate_options(self, value):
        return self.parse_json_list(value, 'options')

    def validate_species(self, value):
        return self.parse_json_list(value, 'species')

    def parse_json_list(self, value, field_name):
        if isinstance(value, str):
            try:
                value = json.loads(value)
            except json.JSONDecodeError:
                raise serializers.ValidationError(
                    f"{field_name} must be a valid JSON array."
                )

        if not isinstance(value, list):
            raise serializers.ValidationError(f"{field_name} must be a list.")

        return value

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

class BookmarkedQuestionSerializer(serializers.ModelSerializer):
    question = QuestionSerializer(read_only=True)

    class Meta:
        model = BookmarkedQuestion
        fields = ['id', 'question', 'created_at']
        read_only_fields = ['id', 'question', 'created_at']
