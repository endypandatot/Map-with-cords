"""
Единые константы и функции для валидации изображений
"""

import os
import logging

logger = logging.getLogger(__name__)

# Допустимые форматы изображений (синхронизировано с фронтендом)
ALLOWED_IMAGE_FORMATS = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.bmp'
]

# Допустимые MIME-типы (синхронизировано с фронтендом)
ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp'
]

# Максимальный размер файла (1 МБ)
MAX_IMAGE_SIZE_BYTES = 1 * 1024 * 1024
MAX_IMAGE_SIZE_MB = 1


def get_allowed_formats_string():
    """Получить строку с допустимыми форматами для отображения"""
    return ', '.join([fmt.upper().replace('.', '') for fmt in ALLOWED_IMAGE_FORMATS])


def is_valid_image_extension(filename):
    """
    Проверка расширения файла

    Args:
        filename (str): Имя файла

    Returns:
        bool: True если расширение допустимо
    """
    if not filename or not isinstance(filename, str):
        return False
    file_ext = os.path.splitext(filename.lower())[1]
    return file_ext in ALLOWED_IMAGE_FORMATS


def is_valid_mime_type(mime_type):
    """
    Проверка MIME-типа

    Args:
        mime_type (str): MIME-тип файла

    Returns:
        bool: True если MIME-тип допустим
    """
    if not mime_type or not isinstance(mime_type, str):
        return False
    return mime_type.lower() in ALLOWED_MIME_TYPES


def is_valid_image_size(size_in_bytes):
    """
    Проверка размера файла

    Args:
        size_in_bytes (int): Размер файла в байтах

    Returns:
        bool: True если размер допустим
    """
    return size_in_bytes <= MAX_IMAGE_SIZE_BYTES


def validate_image_file(file):
    """
    Комплексная проверка файла изображения
    Проверяет: размер, расширение, MIME-тип

    Args:
        file: Объект загруженного файла (Django UploadedFile)

    Returns:
        list: Список ошибок (пустой список если файл валиден)
    """
    errors = []
    logger.info(f"\n{'=' * 60}")
    logger.info(f"🔍 VALIDATING FILE: {file.name}")
    logger.info(f"{'=' * 60}")

    # 1. Проверка размера файла
    file_size_mb = file.size / (1024 * 1024)
    logger.info(f"📦 File size: {file.size} bytes ({file_size_mb:.2f} MB)")

    if not is_valid_image_size(file.size):
        error_msg = f'Файл {file.name} слишком большой ({file_size_mb:.2f} МБ). Максимум: {MAX_IMAGE_SIZE_MB} МБ'
        logger.error(f"❌ {error_msg}")
        errors.append(error_msg)

    # 2. Проверка расширения файла
    file_ext = os.path.splitext(file.name.lower())[1]
    logger.info(f"📄 File extension: {file_ext}")

    if not is_valid_image_extension(file.name):
        error_msg = f'Файл {file.name} имеет недопустимое расширение. Разрешены: {get_allowed_formats_string()}'
        logger.error(f"❌ {error_msg}")
        errors.append(error_msg)

    # 3. Проверка MIME-типа из заголовка
    logger.info(f"🏷️  Content-Type (from header): {file.content_type}")

    if not is_valid_mime_type(file.content_type):
        error_msg = f'Файл {file.name} имеет недопустимый MIME-тип: {file.content_type}. Разрешены: {", ".join(ALLOWED_MIME_TYPES)}'
        logger.error(f"❌ {error_msg}")
        errors.append(error_msg)

    # Итоговый результат
    if errors:
        logger.error(f"❌ VALIDATION FAILED with {len(errors)} error(s)")
        for i, err in enumerate(errors, 1):
            logger.error(f"   {i}. {err}")
    else:
        logger.info(f"✅ VALIDATION PASSED")

    logger.info(f"{'=' * 60}\n")
    return errors
