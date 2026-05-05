from rest_framework import serializers
from .models import Flashcard, FlashcardProgress, MAX_FLASHCARD_TOTAL_CHARS

class FlashcardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flashcard
        fields = '__all__'
        read_only_fields = ['creator', 'created_at', 'updated_at']

    def validate_front(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Front cannot be empty.")
        return value

    def validate_back(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Back cannot be empty.")
        return value

    def validate(self, attrs):
        front = attrs.get("front", getattr(self.instance, "front", "")).strip()
        back = attrs.get("back", getattr(self.instance, "back", "")).strip()
        total = len(front) + len(back)

        if total > MAX_FLASHCARD_TOTAL_CHARS:
            raise serializers.ValidationError({
                "detail": (
                    f"Front and back combined must be {MAX_FLASHCARD_TOTAL_CHARS} "
                    f"characters or fewer. Current total is {total}."
                )
            })

        attrs["front"] = front
        attrs["back"] = back
        return attrs

class FlashcardProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = FlashcardProgress
        fields = '__all__'
        read_only_fields = ['user', 'last_reviewed']
