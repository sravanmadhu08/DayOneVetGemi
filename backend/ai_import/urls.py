from django.urls import path
from .views import ParseQuestionsView

urlpatterns = [
    path('parse-questions/', ParseQuestionsView.as_view(), name='parse-questions'),
]
