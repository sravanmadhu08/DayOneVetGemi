from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
import json

class AIParsingTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.client.force_authenticate(user=self.user)
        self.url = reverse('parse-questions')

    def test_missing_payload(self):
        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.json())

    @patch('ai_import.services.genai.GenerativeModel.generate_content')
    def test_valid_parsing(self, mock_generate):
        # Mocking Gemini response
        mock_response = MagicMock()
        mock_response.text = json.dumps([{
            "question_text": "What is the primary host for Feline Panleukopenia?",
            "options": ["Dogs", "Cats", "Horses", "Cows"],
            "correct_answer_index": 1,
            "explanation": "It primarily affects cats.",
            "species": ["Feline"],
            "system": "Immunology"
        }])
        mock_generate.return_value = mock_response

        response = self.client.post(self.url, {'text': 'Some text about cats.'})
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['question_text'], "What is the primary host for Feline Panleukopenia?")

    @patch('ai_import.services.genai.GenerativeModel.generate_content')
    def test_invalid_json_from_gemini(self, mock_generate):
        mock_response = MagicMock()
        mock_response.text = "NOT JSON"
        mock_generate.return_value = mock_response

        response = self.client.post(self.url, {'text': 'Some text.'})
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.json())

    def test_unauthenticated_access(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(self.url, {'text': 'Some text.'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
