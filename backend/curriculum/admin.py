from django.contrib import admin
from .models import StudyModule, ModuleSection, ModuleProgress

class ModuleSectionInline(admin.TabularInline):
    model = ModuleSection
    extra = 1

@admin.register(StudyModule)
class StudyModuleAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'order', 'created_at')
    list_filter = ('category',)
    search_fields = ('title', 'content')
    inlines = [ModuleSectionInline]

@admin.register(ModuleSection)
class ModuleSectionAdmin(admin.ModelAdmin):
    list_display = ('title', 'module', 'order')
    list_filter = ('module',)
    search_fields = ('title', 'content')

@admin.register(ModuleProgress)
class ModuleProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'module', 'current_section_index', 'completed', 'last_accessed')
    list_filter = ('completed', 'module')
    search_fields = ('user__username', 'module__title')
