from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from accounts.views import UserProfileViewSet, GlobalSettingViewSet, RegisterView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from curriculum.views import StudyModuleViewSet, ModuleSectionViewSet, ModuleProgressViewSet
from quizzes.views import QuestionViewSet, QuizAttemptViewSet, CompletedPracticeQuestionViewSet, BookmarkedQuestionViewSet
from flashcards.views import FlashcardViewSet, FlashcardProgressViewSet
from library.views import DocumentViewSet, GuidelineViewSet, ResourceViewSet
from subscriptions.views import SubscriptionViewSet

router = DefaultRouter()
router.register(r'profile', UserProfileViewSet, basename='profile')
router.register(r'settings', GlobalSettingViewSet, basename='settings')
router.register(r'modules', StudyModuleViewSet)
router.register(r'sections', ModuleSectionViewSet)
router.register(r'module-progress', ModuleProgressViewSet)
router.register(r'questions', QuestionViewSet)
router.register(r'quiz-attempts', QuizAttemptViewSet)
router.register(r'completed-questions', CompletedPracticeQuestionViewSet)
router.register(r'bookmarked-questions', BookmarkedQuestionViewSet, basename='bookmarked-questions')
router.register(r'flashcards', FlashcardViewSet)
router.register(r'flashcard-progress', FlashcardProgressViewSet)
router.register(r'documents', DocumentViewSet)
router.register(r'guidelines', GuidelineViewSet)
router.register(r'resources', ResourceViewSet)
router.register(r'subscription', SubscriptionViewSet, basename='subscription')

def health_check(request):
    return JsonResponse({
        "status": "ok", 
        "message": "Backend is running",
    })

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('api/health/', health_check, name='health_check'),
    path('api/auth/register/', RegisterView.as_view(), name='register'),
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
