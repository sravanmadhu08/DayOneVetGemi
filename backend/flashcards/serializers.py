from rest_framework import serializers
from .models import Flashcard, FlashcardProgress

class FlashcardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flashcard
        fields = '__all__'
        read_only_fields = ['creator', 'created_at', 'updated_at']

class FlashcardProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = FlashcardProgress
        fields = '__all__'
        read_only_fields = ['user', 'last_reviewed']
