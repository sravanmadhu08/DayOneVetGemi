from django.test import TestCase
from django.contrib.auth.models import User
from .models import UserProfile

class UserProfileModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='test@example.com', password='password')

    def test_profile_creation(self):
        profile = UserProfile.objects.create(user=self.user, specialty='Surgery')
        self.assertEqual(profile.user.username, 'testuser')
        self.assertEqual(profile.specialty, 'Surgery')
        self.assertEqual(str(profile), 'testuser')
