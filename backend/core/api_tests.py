from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse
from quizzes.models import Question

class PermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='normaluser', password='password123')
        self.admin = User.objects.create_superuser(username='adminuser', password='password123', email='admin@example.com')
        
        self.question = Question.objects.create(
            question_text="Test Question",
            options=["A", "B"],
            correct_answer_index=0,
            explanation="Test",
            species=["Canine"],
            system="Cardiology"
        )

    def test_anonymous_access_denied(self):
        response = self.client.get(reverse('question-list'))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_normal_user_read_access(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(reverse('question-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_normal_user_write_denied(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(reverse('question-list'), {
            "question_text": "Illegal Question",
            "options": ["A", "B"],
            "correct_answer_index": 0,
            "explanation": "Test",
            "species": ["Canine"],
            "system": "Cardiology"
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_write_allowed(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(reverse('question-list'), {
            "question_text": "Legal Question",
            "options": ["A", "B"],
            "correct_answer_index": 0,
            "explanation": "Test",
            "species": ["Feline"],
            "system": "Digestive"
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
