from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
import logging

from .subscription_limits import get_max_routes, get_max_points_per_route
from .serializers import RouteSerializer, PointSerializer, PointImageSerializer
from .models import Route, Point, PointImage
from .image_validation import validate_image_file

# Настройка логгера
logger = logging.getLogger(__name__)


class RouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.prefetch_related('points__images').all()
    permission_classes = [IsAuthenticated]
    serializer_class = RouteSerializer

    def get_serializer_context(self):
        """Передаём request в контекст сериализатора для валидации"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_queryset(self):
        return Route.objects.filter(user=self.request.user).prefetch_related('points__images')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_create(self, serializer):
        user = self.request.user
        profile = user.profile
        current_routes_count = user.routes.count()
        max_routes = get_max_routes(profile.get_subscription_status())
        if current_routes_count >= max_routes:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(
                {'detail': f'Максимальное количество маршрутов ({max_routes}) достигнуто. Обновите подписку.'})
        serializer.save(user=user)

    def update(self, request, *args, **kwargs):
        # При обновлении маршрута проверяем количество точек
        instance = self.get_object()
        points_data = request.data.get('points', [])
        profile = request.user.profile
        max_points = get_max_points_per_route(profile.get_subscription_status())
        if len(points_data) > max_points:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(
                {'points': f'Максимум точек в маршруте: {max_points} (ваш тариф: {profile.subscription_type})'})
        return super().update(request, *args, **kwargs)

class PointViewSet(viewsets.ModelViewSet):
    queryset = Point.objects.prefetch_related('images').all()
    serializer_class = PointSerializer

    def get_serializer_context(self):
        """Передаём request в контекст сериализатора для валидации"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_image(self, request, pk=None):
        """
        Загрузка изображений для точки с комплексной проверкой
        """
        logger.info(f"\n{'#' * 80}")
        logger.info(f"📤 UPLOAD IMAGE REQUEST RECEIVED")
        logger.info(f"{'#' * 80}")
        logger.info(f"Point ID: {pk}")
        logger.info(f"Request method: {request.method}")
        logger.info(f"Content-Type: {request.content_type}")
        logger.info(f"FILES keys: {list(request.FILES.keys())}")

        try:
            point = self.get_object()
            logger.info(f"✅ Point found: {point.name} (ID: {point.id})")
        except Point.DoesNotExist:
            logger.error(f"❌ Point with ID {pk} not found")
            return Response({'error': 'Point not found'}, status=status.HTTP_404_NOT_FOUND)

        images_data = request.FILES.getlist('images')
        logger.info(f"📦 Received {len(images_data)} file(s)")

        if not images_data:
            logger.error("❌ No images provided in request")
            return Response({'error': 'No images provided'}, status=status.HTTP_400_BAD_REQUEST)

        # Проверка на количество существующих изображений
        current_images_count = point.images.count()
        MAX_IMAGES = 4
        logger.info(f"📊 Current images: {current_images_count}/{MAX_IMAGES}")

        if current_images_count >= MAX_IMAGES:
            logger.error(f"❌ Maximum images limit reached")
            return Response(
                {'error': f'Maximum {MAX_IMAGES} images per point'},
                status=status.HTTP_400_BAD_REQUEST
            )

        available_slots = MAX_IMAGES - current_images_count
        logger.info(f"📊 Available slots: {available_slots}")

        if len(images_data) > available_slots:
            logger.error(f"❌ Too many images: {len(images_data)} > {available_slots}")
            return Response(
                {'error': f'Can only upload {available_slots} more images (max {MAX_IMAGES} per point)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Валидация всех файлов ПЕРЕД сохранением
        all_errors = []
        for i, img_file in enumerate(images_data, 1):
            logger.info(f"\n--- Validating file {i}/{len(images_data)} ---")
            file_errors = validate_image_file(img_file)
            if file_errors:
                all_errors.extend(file_errors)

        if all_errors:
            logger.error(f"\n❌ VALIDATION FAILED: {len(all_errors)} error(s)")
            logger.error(f"{'#' * 80}\n")
            return Response(
                {'error': 'Ошибки валидации файлов', 'details': all_errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Если все проверки пройдены, сохраняем изображения
        created_images = []
        try:
            logger.info(f"\n💾 Saving {len(images_data)} image(s)...")
            with transaction.atomic():
                for i, img_file in enumerate(images_data, 1):
                    logger.info(f"   Saving image {i}/{len(images_data)}: {img_file.name}")
                    created_image = PointImage.objects.create(point=point, image=img_file)
                    created_images.append(created_image)
                    logger.info(f"   ✅ Image {i} saved with ID: {created_image.id}")

        except Exception as e:
            logger.error(f"\n❌ ERROR SAVING IMAGES: {str(e)}")
            logger.error(f"{'#' * 80}\n")
            return Response(
                {'error': f'Error saving images: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        serializer = PointImageSerializer(created_images, many=True)
        logger.info(f"\n✅ SUCCESS: {len(created_images)} image(s) uploaded")
        logger.info(f"{'#' * 80}\n")
        return Response(serializer.data, status=status.HTTP_201_CREATED)