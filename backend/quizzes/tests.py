from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Question


class QuestionModelTest(TestCase):
    def test_question_creation(self):
        question = Question.objects.create(
            question_text="What is GDV?",
            options=["A", "B", "C"],
            correct_answer_index=0,
            explanation="Explanation",
            species=["Canine"],
            system="Digestive",
        )
        self.assertEqual(str(question), "What is GDV?")
        self.assertEqual(question.species, ["Canine"])


class BulkQuestionImportTest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin@example.com",
            email="admin@example.com",
            password="pass12345",
            is_staff=True,
        )
        self.user = User.objects.create_user(
            username="user@example.com",
            email="user@example.com",
            password="pass12345",
        )
        self.client = APIClient()
        self.url = "/api/questions/bulk-import/"

    def payload(self, **overrides):
        data = {
            "text": "Which diet is most appropriate for hepatic lipidosis support?",
            "species": "cat",
            "system": "nutrition",
            "explanation": "Cats with hepatic lipidosis require assisted nutritional support.",
            "exam_tip": "Think early feeding tube support.",
            "choices": [
                {"text": "Withhold food", "is_correct": False},
                {"text": "Assisted enteral nutrition", "is_correct": True},
            ],
        }
        data.update(overrides)
        return data

    def authenticate_admin(self):
        self.client.force_authenticate(self.admin)

    def test_successful_bulk_import(self):
        self.authenticate_admin()
        response = self.client.post(self.url, [self.payload()], format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["created_count"], 1)
        question = Question.objects.get()
        self.assertEqual(question.question_text, self.payload()["text"])
        self.assertEqual(question.options, ["Withhold food", "Assisted enteral nutrition"])
        self.assertEqual(question.correct_answer_index, 1)
        self.assertEqual(question.species, ["cat"])
        self.assertEqual(question.exam_tip, "Think early feeding tube support.")
        self.assertEqual(question.creator, self.admin)

    def test_dry_run_does_not_create_records(self):
        self.authenticate_admin()
        response = self.client.post(
            self.url,
            {"questions": [self.payload()], "dry_run": True},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["created_count"], 1)
        self.assertEqual(Question.objects.count(), 0)

    def test_rejects_missing_fields(self):
        self.authenticate_admin()
        invalid = self.payload()
        del invalid["text"]
        response = self.client.post(self.url, [invalid], format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["error_count"], 1)
        self.assertEqual(Question.objects.count(), 0)

    def test_rejects_multiple_correct_answers(self):
        self.authenticate_admin()
        response = self.client.post(
            self.url,
            [self.payload(choices=[
                {"text": "A", "is_correct": True},
                {"text": "B", "is_correct": True},
            ])],
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["error_count"], 1)
        self.assertEqual(Question.objects.count(), 0)

    def test_rejects_zero_correct_answers(self):
        self.authenticate_admin()
        response = self.client.post(
            self.url,
            [self.payload(choices=[
                {"text": "A", "is_correct": False},
                {"text": "B", "is_correct": False},
            ])],
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["error_count"], 1)
        self.assertEqual(Question.objects.count(), 0)

    def test_converts_species_string_to_list(self):
        self.authenticate_admin()
        response = self.client.post(self.url, [self.payload(species="dog")], format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Question.objects.get().species, ["dog"])

    def test_skips_duplicates_when_requested(self):
        Question.objects.create(
            question_text=self.payload()["text"],
            options=["A", "B"],
            correct_answer_index=0,
            explanation="Existing",
            species=["cat"],
            system="nutrition",
        )
        self.authenticate_admin()
        response = self.client.post(
            self.url,
            {"questions": [self.payload()], "skip_duplicates": True},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["created_count"], 0)
        self.assertEqual(response.data["skipped_count"], 1)
        self.assertEqual(Question.objects.count(), 1)

    def test_non_admin_users_cannot_import(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(self.url, [self.payload()], format="json")
        self.assertEqual(response.status_code, 403)
        self.assertEqual(Question.objects.count(), 0)

    def test_imports_uploaded_json_text_file(self):
        self.authenticate_admin()
        upload = SimpleUploadedFile(
            "questions.txt",
            b"""[
              {
                "text": "Uploaded question?",
                "species": "cat",
                "system": "nutrition",
                "explanation": "Uploaded explanation",
                "choices": [
                  { "text": "A", "is_correct": false },
                  { "text": "B", "is_correct": true }
                ]
              }
            ]""",
            content_type="text/plain",
        )
        response = self.client.post(self.url, {"file": upload}, format="multipart")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["created_count"], 1)
        self.assertEqual(Question.objects.get().question_text, "Uploaded question?")

    def test_rejects_uploaded_file_with_invalid_json(self):
        self.authenticate_admin()
        upload = SimpleUploadedFile(
            "questions.txt",
            b"{not valid json",
            content_type="text/plain",
        )
        response = self.client.post(self.url, {"file": upload}, format="multipart")
        self.assertEqual(response.status_code, 400)
        self.assertIn("valid JSON", response.data["detail"])
