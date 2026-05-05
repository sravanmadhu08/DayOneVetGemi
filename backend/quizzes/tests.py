from django.test import TestCase
from .models import Question

class QuestionModelTest(TestCase):
    def test_question_creation(self):
        question = Question.objects.create(
            question_text="What is GDV?",
            options=["A", "B", "C"],
            correct_answer_index=0,
            explanation="Explanation",
            species=["Canine"],
            system="Digestive"
        )
        self.assertEqual(str(question), "What is GDV?")
        self.assertEqual(question.species, ["Canine"])
