from django.db import models
from django.contrib.auth.models import User

class Flashcard(models.Model):
    front = models.TextField()
    back = models.TextField()
    deck = models.CharField(max_length=100)
    creator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    tags = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.deck}: {self.front[:30]}"

class FlashcardProgress(models.Model):
    user = models.ForeignKey(User, related_name='flashcard_progress', on_delete=models.CASCADE)
    flashcard = models.ForeignKey(Flashcard, on_delete=models.CASCADE)
    interval = models.IntegerField(default=0)
    ease = models.FloatField(default=2.5)
    next_review = models.DateTimeField()
    last_reviewed = models.DateTimeField(auto_now=True)
    consecutive_correct = models.IntegerField(default=0)

    class Meta:
        unique_together = ('user', 'flashcard')
        verbose_name_plural = "Flashcard progress records"

    def __str__(self):
        return f"{self.user.username} - {self.flashcard.id}"
