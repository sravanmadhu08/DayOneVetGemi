from django.contrib import admin
from .models import UserProfile

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'specialty', 'subscription_plan', 'created_at')
    search_fields = ('user__username', 'user__email', 'specialty', 'institution')

@admin.register(GlobalSetting)
class GlobalSettingAdmin(admin.ModelAdmin):
    list_display = ('key', 'updated_at')
    search_fields = ('key', 'description')
