# map/api_views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction
from django.core.files.uploadedfile import UploadedFile
import magic  # python-magic для проверки MIME-типа по содержимому
import os

from .serializers import RouteSerializer, PointSerializer, PointImageSerializer
from .models import Route, Point, PointImage


def validate_image_file(file):
    """
    Комплексная проверка файла изображения на бэкенде
    Проверяет: размер, расширение, MIME-тип и magic bytes (сигнатуру)
    """
    errors = []

    # 1. Проверка размера файла (максимум 1 МБ)
    MAX_SIZE = 1 * 1024 * 1024  # 1 MB
    if file.size > MAX_SIZE:
        errors.append(f'Файл {file.name} слишком большой ({file.size / (1024 * 1024):.2f} МБ). Максимум: 1 МБ')

    # 2. Проверка расширения файла
    valid_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.tiff', '.tif', '.heic', '.heif']
    file_ext = os.path.splitext(file.name.lower())[1]
    if file_ext not in valid_extensions:
        errors.append(f'Файл {file.name} имеет недопустимое расширение. Разрешены: {", ".join(valid_extensions)}')

    # 3. Проверка MIME-типа из заголовка
    valid_mime_types = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
        'image/webp', 'image/bmp', 'image/svg+xml', 'image/tiff',
        'image/heic', 'image/heif'
    ]
    if file.content_type.lower() not in valid_mime_types:
        errors.append(f'Файл {file.name} имеет недопустимый MIME-тип: {file.content_type}')

    # 4. НОВОЕ: Проверка реального типа файла по magic bytes (сигнатуре)
    try:
        # Читаем первые байты файла для определения типа
        file.seek(0)  # Возвращаемся в начало файла
        file_header = file.read(8192)  # Читаем первые 8 КБ
        file.seek(0)  # Снова возвращаемся в начало

        # Используем python-magic для определения типа по содержимому
        mime = magic.from_buffer(file_header, mime=True)

        # Проверяем, что определённый тип соответствует изображению
        if not mime.startswith('image/'):
            errors.append(f'Файл {file.name} не является изображением (определён как: {mime})')

        # Дополнительная проверка: MIME из заголовка должен совпадать с реальным
        if file.content_type != mime and not (
                # Допускаем некоторые варианты для JPEG
                (file.content_type in ['image/jpg', 'image/jpeg'] and mime in ['image/jpg', 'image/jpeg'])
        ):
            errors.append(
                f'Файл {file.name}: несоответствие типов. '
                f'Заявлен: {file.content_type}, реальный: {mime}'
            )

    except Exception as e:
        errors.append(f'Ошибка проверки файла {file.name}: {str(e)}')

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
        try:
            point = self.get_object()
        except Point.DoesNotExist:
            return Response({'error': 'Point not found'}, status=status.HTTP_404_NOT_FOUND)

        images_data = request.FILES.getlist('images')

        if not images_data:
            return Response({'error': 'No images provided'}, status=status.HTTP_400_BAD_REQUEST)

        # Проверка на количество существующих изображений
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

        # НОВОЕ: Валидация всех файлов ПЕРЕД сохранением
        all_errors = []
        for img_file in images_data:
            file_errors = validate_image_file(img_file)
            if file_errors:
                all_errors.extend(file_errors)

        if all_errors:
            return Response(
                {'error': 'Ошибки валидации файлов', 'details': all_errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Если все проверки пройдены, сохраняем изображения
        created_images = []
        try:
            with transaction.atomic():
                for img_file in images_data:
                    created_image = PointImage.objects.create(point=point, image=img_file)
                    created_images.append(created_image)

        except Exception as e:
            return Response(
                {'error': f'Error saving images: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        serializer = PointImageSerializer(created_images, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
