from rest_framework import viewsets, permissions
from .models import StudyModule, ModuleSection, ModuleProgress
from .serializers import StudyModuleSerializer, ModuleSectionSerializer, ModuleProgressSerializer
from core.permissions import IsAdminOrReadOnly, IsOwner

class StudyModuleViewSet(viewsets.ModelViewSet):
    queryset = StudyModule.objects.all()
    serializer_class = StudyModuleSerializer
    permission_classes = [IsAdminOrReadOnly]

class ModuleSectionViewSet(viewsets.ModelViewSet):
    queryset = ModuleSection.objects.all()
    serializer_class = ModuleSectionSerializer
    permission_classes = [IsAdminOrReadOnly]

class ModuleProgressViewSet(viewsets.ModelViewSet):
    queryset = ModuleProgress.objects.all()
    serializer_class = ModuleProgressSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]

    def get_queryset(self):
        if self.request.user.is_staff:
            return ModuleProgress.objects.all()
        return ModuleProgress.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
