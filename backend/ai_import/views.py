from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .services import GeminiParsingService
from quizzes.serializers import QuestionSerializer
import logging

logger = logging.getLogger(__name__)

class ParseQuestionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        text = request.data.get('text')
        file = request.FILES.get('file')
        source_id = request.data.get('source_id')
        
        if not text and not file:
            return Response(
                {"error": "Either 'text' or 'file' must be provided."},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        service = GeminiParsingService()
        
        try:
            if file:
                if not file.name.endswith('.docx'):
                    return Response(
                        {"error": "Only .docx files are supported."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                text = service.extract_text_from_docx(file)
            
            questions_data = service.parse_questions(text)
            questions = service.save_questions(questions_data, creator=request.user, source_id=source_id)
            
            serializer = QuestionSerializer(questions, many=True)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.exception("AI parsing failed")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
