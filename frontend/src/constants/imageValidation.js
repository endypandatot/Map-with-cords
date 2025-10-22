// Допустимые форматы изображений
export const ALLOWED_IMAGE_FORMATS = [
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.bmp'
];

// Допустимые MIME-типы
export const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp'
];

// Максимальный размер файла в байтах (1 МБ)
export const MAX_IMAGE_SIZE_BYTES = 1 * 1024 * 1024;

// Максимальный размер файла в МБ (для отображения)
export const MAX_IMAGE_SIZE_MB = 1;

/**
 * Проверка расширения файла
 * @param {string} fileName - Имя файла
 * @returns {boolean}
 */
export const isValidImageExtension = (fileName) => {
    if (!fileName || typeof fileName !== 'string') return false;
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    return ALLOWED_IMAGE_FORMATS.includes(extension);
};

/**
 * Проверка MIME-типа
 * @param {string} mimeType - MIME-тип файла
 * @returns {boolean}
 */
export const isValidMimeType = (mimeType) => {
    if (!mimeType || typeof mimeType !== 'string') return false;
    return ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase());
};

/**
 * Проверка размера файла
 * @param {number} sizeInBytes - Размер файла в байтах
 * @returns {boolean}
 */
export const isValidImageSize = (sizeInBytes) => {
    return sizeInBytes <= MAX_IMAGE_SIZE_BYTES;
};

/**
 * Получить строку с допустимыми форматами для отображения
 * @returns {string}
 */
export const getAllowedFormatsString = () => {
    return ALLOWED_IMAGE_FORMATS.map(f => f.toUpperCase().replace('.', '')).join(', ');
};

/**
 * Получить строку accept для input[type="file"]
 * @returns {string}
 */
export const getAcceptString = () => {
    return ALLOWED_MIME_TYPES.join(',');
};
