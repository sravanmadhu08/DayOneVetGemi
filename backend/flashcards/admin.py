from django.contrib import admin
from .models import Flashcard, FlashcardProgress

@admin.register(Flashcard)
class FlashcardAdmin(admin.ModelAdmin):
    list_display = ('front', 'deck', 'created_at')
    list_filter = ('deck',)
    search_fields = ('front', 'back', 'deck')

@admin.register(FlashcardProgress)
class FlashcardProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'flashcard', 'interval', 'next_review', 'last_reviewed')
    list_filter = ('next_review', 'user')
    search_fields = ('user__username', 'flashcard__front')
