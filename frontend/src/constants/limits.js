
export const LIMITS = {
    // Ограничения для маршрутов
    MAX_ROUTES_PER_USER: 15,           // Максимум маршрутов на пользователя
    MAX_POINTS_PER_ROUTE: 30,          // Максимум точек в одном маршруте

    // Ограничения для точек
    MAX_IMAGES_PER_POINT: 4,           // Максимум фотографий на точку
    MAX_IMAGE_SIZE_MB: 1,              // Максимальный размер одного изображения (МБ)
    MAX_IMAGE_SIZE_BYTES: 1 * 1024 * 1024, // То же в байтах

    // Текстовые ограничения
    MAX_ROUTE_NAME_LENGTH: 100,        // Максимальная длина названия маршрута
    MAX_ROUTE_DESCRIPTION_LENGTH: 500, // Максимальная длина описания маршрута
    MAX_POINT_NAME_LENGTH: 100,        // Максимальная длина названия точки
    MAX_POINT_DESCRIPTION_LENGTH: 1000, // Максимальная длина описания точки
};

/**
 * Сообщения об ошибках для пользователя
 */
export const LIMIT_MESSAGES = {
    MAX_ROUTES: `Достигнут лимит маршрутов (${LIMITS.MAX_ROUTES_PER_USER}). Удалите старые маршруты для создания новых.`,
    MAX_POINTS: `Достигнут лимит точек в маршруте (${LIMITS.MAX_POINTS_PER_ROUTE}). Создайте новый маршрут для добавления дополнительных точек.`,
    MAX_IMAGES: `Достигнут лимит фотографий на точку (${LIMITS.MAX_IMAGES_PER_POINT}).`,
    MAX_IMAGE_SIZE: `Размер изображения не должен превышать ${LIMITS.MAX_IMAGE_SIZE_MB} МБ.`,
    MAX_ROUTE_NAME: `Название маршрута не должно превышать ${LIMITS.MAX_ROUTE_NAME_LENGTH} символов.`,
    MAX_ROUTE_DESCRIPTION: `Описание маршрута не должно превышать ${LIMITS.MAX_ROUTE_DESCRIPTION_LENGTH} символов.`,
    MAX_POINT_NAME: `Название точки не должно превышать ${LIMITS.MAX_POINT_NAME_LENGTH} символов.`,
    MAX_POINT_DESCRIPTION: `Описание точки не должно превышать ${LIMITS.MAX_POINT_DESCRIPTION_LENGTH} символов.`,
};

/**
 * Проверка лимитов
 */
export const checkLimits = {
    /**
     * Проверка возможности создания нового маршрута
     */
    canCreateRoute: (currentRoutesCount) => {
        return currentRoutesCount < LIMITS.MAX_ROUTES_PER_USER;
    },

    /**
     * Проверка возможности добавления точки в маршрут
     */
    canAddPoint: (currentPointsCount) => {
        return currentPointsCount < LIMITS.MAX_POINTS_PER_ROUTE;
    },

    /**
     * Проверка возможности добавления изображения к точке
     */
    canAddImage: (currentImagesCount) => {
        return currentImagesCount < LIMITS.MAX_IMAGES_PER_POINT;
    },

    /**
     * Проверка размера изображения
     */
    isImageSizeValid: (sizeInBytes) => {
        return sizeInBytes <= LIMITS.MAX_IMAGE_SIZE_BYTES;
    },

    /**
     * Проверка длины текста
     */
    isTextLengthValid: (text, maxLength) => {
        return text.length <= maxLength;
    },
};

/**
 * Вспомогательные функции для форматирования
 */
export const formatters = {
    /**
     * Форматирование размера файла для отображения
     */
    formatFileSize: (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    },

    /**
     * Получение оставшегося количества
     */
    getRemainingCount: (current, max) => {
        return Math.max(0, max - current);
    },
};