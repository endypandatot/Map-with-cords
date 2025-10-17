from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction
from django.core.files.uploadedfile import UploadedFile
# import magic  #
import os
import logging

from .serializers import RouteSerializer, PointSerializer, PointImageSerializer
from .models import Route, Point, PointImage

# Настройка логгера
logger = logging.getLogger(__name__)


def validate_image_file(file):
    """
    Комплексная проверка файла изображения на бэкенде
    Проверяет: размер, расширение, MIME-тип (без magic bytes)
    """
    errors = []
    logger.info(f"\n{'=' * 60}")
    logger.info(f"🔍 VALIDATING FILE: {file.name}")
    logger.info(f"{'=' * 60}")

    # 1. Проверка размера файла (максимум 1 МБ)
    MAX_SIZE = 1 * 1024 * 1024  # 1 MB
    file_size_mb = file.size / (1024 * 1024)
    logger.info(f"📦 File size: {file.size} bytes ({file_size_mb:.2f} MB)")

    if file.size > MAX_SIZE:
        error_msg = f'Файл {file.name} слишком большой ({file_size_mb:.2f} МБ). Максимум: 1 МБ'
        logger.error(f"❌ {error_msg}")
        errors.append(error_msg)

    # 2. Проверка расширения файла
    valid_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
    file_ext = os.path.splitext(file.name.lower())[1]
    logger.info(f"📄 File extension: {file_ext}")

    if file_ext not in valid_extensions:
        error_msg = f'Файл {file.name} имеет недопустимое расширение. Разрешены: {", ".join(valid_extensions)}'
        logger.error(f"❌ {error_msg}")
        errors.append(error_msg)

    # 3. Проверка MIME-типа из заголовка
    valid_mime_types = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
        'image/webp', 'image/bmp'
    ]
    logger.info(f"🏷️  Content-Type (from header): {file.content_type}")

    if file.content_type.lower() not in valid_mime_types:
        error_msg = f'Файл {file.name} имеет недопустимый MIME-тип: {file.content_type}'
        logger.error(f"❌ {error_msg}")
        errors.append(error_msg)


    # try:
    #     file.seek(0)
    #     file_header = file.read(8192)
    #     file.seek(0)
    #     mime = magic.from_buffer(file_header, mime=True)
    #     logger.info(f"🔬 Real MIME type (magic bytes): {mime}")
    #     if not mime.startswith('image/'):
    #         error_msg = f'Файл {file.name} не является изображением (определён как: {mime})'
    #         logger.error(f"❌ {error_msg}")
    #         errors.append(error_msg)
    # except Exception as e:
    #     error_msg = f'Ошибка проверки файла {file.name}: {str(e)}'
    #     logger.error(f"❌ {error_msg}")
    #     errors.append(error_msg)

    logger.info(f"⚠️  Magic bytes validation SKIPPED (python-magic not configured)")

    if errors:
        logger.error(f"❌ VALIDATION FAILED with {len(errors)} error(s)")
        for i, err in enumerate(errors, 1):
            logger.error(f"   {i}. {err}")
    else:
        logger.info(f"✅ VALIDATION PASSED")

    logger.info(f"{'=' * 60}\n")
    return errors


class RouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.prefetch_related('points__images').all()
    serializer_class = RouteSerializer

    def get_serializer_context(self):
        """Передаём request в контекст сериализатора для валидации"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


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
