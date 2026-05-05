from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, related_name='profile', on_delete=models.CASCADE)
    bio = models.TextField(blank=True, null=True)
    specialty = models.CharField(max_length=100, blank=True, null=True)
    institution = models.CharField(max_length=200, blank=True, null=True)
    photo_url = models.URLField(blank=True, null=True)
    google_sub = models.CharField(max_length=255, unique=True, blank=True, null=True)
    
    # Progress and stats can be stored as JSON for flexibility, 
    # or broken down into other models if needed.
    # For now, let's keep it close to Firebase structure but ready for relational expansion.
    progress = models.JSONField(default=dict, blank=True)
    quiz_stats = models.JSONField(default=dict, blank=True)
    
    subscription_plan = models.CharField(max_length=50, default='free')
    subscription_until = models.DateTimeField(null=True, blank=True)
    
    is_admin = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.user.username

class GlobalSetting(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value = models.JSONField()
    description = models.TextField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.key
