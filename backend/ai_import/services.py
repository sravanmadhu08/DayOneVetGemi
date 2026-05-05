import os
import json
import logging
import google.generativeai as genai
from docx import Document
from django.conf import settings
from quizzes.models import Question

logger = logging.getLogger(__name__)

class GeminiParsingService:
    def __init__(self):
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash-latest')

    def extract_text_from_docx(self, docx_file):
        doc = Document(docx_file)
        full_text = []
        for para in doc.paragraphs:
            full_text.append(para.text)
        return '\n'.join(full_text)

    def parse_questions(self, text, system_context="Veterinary Medicine"):
        prompt = f"""
        You are an expert in {system_context}. 
        Parse the following text and extract multiple-choice questions.
        Return ONLY a JSON array of objects with the following structure:
        {{
            "question_text": "string",
            "options": ["string", "string", "string", "string"],
            "correct_answer_index": integer (0-indexed),
            "explanation": "string",
            "species": ["string"],
            "system": "string"
        }}
        
        Text to parse:
        {text}
        """
        
        response = self.model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        
        try:
            questions_data = json.loads(response.text)
            if not isinstance(questions_data, list):
                # Sometimes it might wrap it in a root object
                if isinstance(questions_data, dict) and "questions" in questions_data:
                    questions_data = questions_data["questions"]
                else:
                    raise ValueError("JSON response is not a list")
            return questions_data
        except json.JSONDecodeError as e:
            logger.error(f"Failed to decode JSON from Gemini: {response.text}")
            raise ValueError(f"Invalid JSON response from AI: {str(e)}")

    def save_questions(self, questions_data, creator=None, source_id=None):
        created_questions = []
        source_doc = None
        if source_id:
            from library.models import Document as LibraryDoc
            try:
                source_doc = LibraryDoc.objects.get(id=source_id)
            except LibraryDoc.DoesNotExist:
                pass

        for q_data in questions_data:
            # Basic validation
            required_fields = ['question_text', 'options', 'correct_answer_index', 'explanation', 'species', 'system']
            if all(field in q_data for field in required_fields):
                question = Question.objects.create(
                    question_text=q_data['question_text'],
                    options=q_data['options'],
                    correct_answer_index=q_data['correct_answer_index'],
                    explanation=q_data['explanation'],
                    species=q_data['species'],
                    system=q_data['system'],
                    creator=creator,
                    source_document=source_doc
                )
                created_questions.append(question)
        return created_questions
