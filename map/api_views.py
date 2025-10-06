from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction

from .serializers import RouteSerializer, PointSerializer, PointImageSerializer
from .models import Route, Point, PointImage


class RouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.prefetch_related('points__images').all()
    serializer_class = RouteSerializer


class PointViewSet(viewsets.ModelViewSet):
    queryset = Point.objects.prefetch_related('images').all()  # Добавляем prefetch для оптимизации
    serializer_class = PointSerializer

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_image(self, request, pk=None):
        try:
            point = self.get_object()
        except Point.DoesNotExist:
            return Response({'error': 'Point not found'}, status=status.HTTP_404_NOT_FOUND)

        images_data = request.FILES.getlist('images')

        if not images_data:
            return Response({'error': 'No images provided'}, status=status.HTTP_400_BAD_REQUEST)

        # НОВОЕ: проверка на количество существующих изображений
        current_images_count = point.images.count()
        MAX_IMAGES = 4

        if current_images_count >= MAX_IMAGES:
            return Response(
                {'error': f'Maximum {MAX_IMAGES} images per point'},
                status=status.HTTP_400_BAD_REQUEST
            )

        available_slots = MAX_IMAGES - current_images_count
        if len(images_data) > available_slots:
            return Response(
                {'error': f'Can only upload {available_slots} more images (max {MAX_IMAGES} per point)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        created_images = []
        try:
            with transaction.atomic():
                for img_file in images_data:
                    # ИЗМЕНЕНО: лимит увеличен до 30 МБ
                    if img_file.size > 30 * 1024 * 1024:
                        return Response(
                            {'error': f'File {img_file.name} is too large. Maximum size is 30MB'},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    created_image = PointImage.objects.create(point=point, image=img_file)
                    created_images.append(created_image)

        except Exception as e:
            return Response(
                {'error': f'Error saving images: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        serializer = PointImageSerializer(created_images, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)