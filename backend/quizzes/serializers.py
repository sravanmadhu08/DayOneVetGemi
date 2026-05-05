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
        fields = ['id', 'question', 'question_text', 'options', 'correctAnswer', 'correct_answer_index', 'explanation', 'exam_tip', 'species', 'system', 'image', 'image_url', 'isBookmarked', 'creator', 'created_at', 'updated_at']
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

class BulkChoiceSerializer(serializers.Serializer):
    text = serializers.CharField()
    is_correct = serializers.BooleanField()

    def validate_text(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Choice text is required.")
        return value

class BulkQuestionImportSerializer(serializers.Serializer):
    text = serializers.CharField()
    species = serializers.JSONField()
    system = serializers.CharField()
    explanation = serializers.CharField()
    exam_tip = serializers.CharField(required=False, allow_blank=True, default="")
    choices = BulkChoiceSerializer(many=True)

    def validate_text(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Question text is required.")
        return value

    def validate_system(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("System is required.")
        return value

    def validate_explanation(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Explanation is required.")
        return value

    def validate_species(self, value):
        if isinstance(value, str):
            value = value.strip()
            if not value:
                raise serializers.ValidationError("Species is required.")
            return [value]

        if isinstance(value, list):
            species = []
            for item in value:
                if not isinstance(item, str) or not item.strip():
                    raise serializers.ValidationError("Species must contain non-empty strings.")
                species.append(item.strip())
            if not species:
                raise serializers.ValidationError("Species is required.")
            return species

        raise serializers.ValidationError("Species must be a string or list.")

    def validate(self, attrs):
        choices = attrs.get("choices", [])
        if len(choices) < 2:
            raise serializers.ValidationError({"choices": "At least 2 choices are required."})

        correct_indexes = [
            index for index, choice in enumerate(choices)
            if choice.get("is_correct") is True
        ]
        if len(correct_indexes) != 1:
            raise serializers.ValidationError({
                "choices": "Exactly one choice must have is_correct=true."
            })

        attrs["options"] = [choice["text"] for choice in choices]
        attrs["correct_answer_index"] = correct_indexes[0]
        return attrs

    def to_question_kwargs(self):
        data = self.validated_data
        return {
            "question_text": data["text"],
            "options": data["options"],
            "correct_answer_index": data["correct_answer_index"],
            "explanation": data["explanation"],
            "exam_tip": data.get("exam_tip", ""),
            "species": data["species"],
            "system": data["system"],
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

class BookmarkedQuestionSerializer(serializers.ModelSerializer):
    question = QuestionSerializer(read_only=True)

    class Meta:
        model = BookmarkedQuestion
        fields = ['id', 'question', 'created_at']
        read_only_fields = ['id', 'question', 'created_at']
