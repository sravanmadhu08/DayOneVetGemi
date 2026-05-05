from django.db import models
from django.contrib.auth.models import User

class StudyModule(models.Model):
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    content = models.TextField(help_text="Primary content or introduction")
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'title']

    def __str__(self):
        return self.title

class ModuleSection(models.Model):
    module = models.ForeignKey(StudyModule, related_name='sections', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    content = models.TextField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.module.title} - {self.title}"

class ModuleProgress(models.Model):
    user = models.ForeignKey(User, related_name='module_progress', on_delete=models.CASCADE)
    module = models.ForeignKey(StudyModule, on_delete=models.CASCADE)
    current_section_index = models.PositiveIntegerField(default=0)
    completed = models.BooleanField(default=False)
    last_accessed = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'module')

    def __str__(self):
        return f"{self.user.username} - {self.module.title}"
