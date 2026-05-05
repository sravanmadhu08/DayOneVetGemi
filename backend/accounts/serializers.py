from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class UserProfileSerializer(serializers.ModelSerializer):
    uid = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    displayName = serializers.CharField(source='user.first_name', required=False) # Simplified mapping
    photoURL = serializers.CharField(source='photo_url', required=False)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    quizStats = serializers.JSONField(source='quiz_stats', required=False)
    subscriptionPlan = serializers.CharField(source='subscription_plan', required=False)
    subscriptionUntil = serializers.DateTimeField(source='subscription_until', required=False)
    isAdmin = serializers.BooleanField(source='is_admin', read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'uid', 'email', 'displayName', 'photoURL', 'createdAt', 
            'bio', 'specialty', 'institution', 'progress', 
            'quizStats', 'subscriptionPlan', 'subscriptionUntil', 'isAdmin'
        ]
        read_only_fields = ['uid', 'email', 'createdAt', 'subscriptionPlan', 'subscriptionUntil', 'isAdmin']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

class GlobalSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlobalSetting
        fields = '__all__'
