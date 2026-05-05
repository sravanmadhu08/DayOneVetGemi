from rest_framework import status, viewsets, permissions
from rest_framework.response import Response
from .models import StudyModule, ModuleSection, ModuleProgress
from .serializers import StudyModuleSerializer, ModuleSectionSerializer, ModuleProgressSerializer
from core.permissions import IsAdminOrReadOnly, IsOwner

class StudyModuleViewSet(viewsets.ModelViewSet):
    queryset = StudyModule.objects.prefetch_related('sections')
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
        module_id = self.request.query_params.get('module')
        if self.request.user.is_staff:
            queryset = ModuleProgress.objects.select_related('user', 'module')
        else:
            queryset = ModuleProgress.objects.select_related('module').filter(user=self.request.user)

        if module_id:
            queryset = queryset.filter(module_id=module_id)

        return queryset

    def create(self, request, *args, **kwargs):
        module_id = request.data.get('module')
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        progress, created = ModuleProgress.objects.update_or_create(
            user=request.user,
            module_id=module_id,
            defaults={
                'current_section_index': serializer.validated_data.get('current_section_index', 0),
                'completed': serializer.validated_data.get('completed', False),
            },
        )

        output_serializer = self.get_serializer(progress)
        return Response(
            output_serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
