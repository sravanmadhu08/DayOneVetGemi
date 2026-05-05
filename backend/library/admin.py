from django.contrib import admin
from .models import Document, Guideline, Resource

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'size_str', 'created_at')
    search_fields = ('title', 'author')

@admin.register(Guideline)
class GuidelineAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'created_at')
    list_filter = ('category',)
    search_fields = ('title', 'content')

@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ('title', 'resource_type', 'order')
    list_filter = ('resource_type',)
    search_fields = ('title', 'description')
