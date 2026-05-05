from rest_framework import serializers
from .models import StudyModule, ModuleSection, ModuleProgress

class ModuleSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModuleSection
        fields = '__all__'

class StudyModuleSerializer(serializers.ModelSerializer):
    sections = ModuleSectionSerializer(many=True, read_only=True)
    
    class Meta:
        model = StudyModule
        fields = '__all__'

class ModuleProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModuleProgress
        fields = '__all__'
        read_only_fields = ['user']
