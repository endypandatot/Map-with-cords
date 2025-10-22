import {
    isValidImageExtension,
    isValidImageSize,
    MAX_IMAGE_SIZE_MB,
    getAllowedFormatsString
} from './imageValidation';

export const LIMITS = {
    MAX_ROUTES: 5,
    MAX_POINTS_PER_ROUTE: 20,
    MAX_IMAGES_PER_POINT: 4,
    MAX_ROUTE_NAME_LENGTH: 200,
    MAX_ROUTE_DESCRIPTION_LENGTH: 1000,
    MAX_POINT_NAME_LENGTH: 200,
    MAX_POINT_DESCRIPTION_LENGTH: 1000,
    MAX_IMAGE_SIZE_MB: MAX_IMAGE_SIZE_MB,
};

export const LIMIT_MESSAGES = {
    MAX_ROUTES: `Достигнут максимальный лимит маршрутов (${LIMITS.MAX_ROUTES}).`,
    MAX_POINTS: `Достигнут максимальный лимит точек в маршруте (${LIMITS.MAX_POINTS_PER_ROUTE}).`,
    MAX_IMAGES: `Достигнут максимальный лимит изображений для точки (${LIMITS.MAX_IMAGES_PER_POINT}).`,
    MAX_ROUTE_NAME: `Название маршрута не должно превышать ${LIMITS.MAX_ROUTE_NAME_LENGTH} символов.`,
    MAX_ROUTE_DESCRIPTION: `Описание маршрута не должно превышать ${LIMITS.MAX_ROUTE_DESCRIPTION_LENGTH} символов.`,
    MAX_POINT_NAME: `Название точки не должно превышать ${LIMITS.MAX_POINT_NAME_LENGTH} символов.`,
    MAX_POINT_DESCRIPTION: `Описание точки не должно превышать ${LIMITS.MAX_POINT_DESCRIPTION_LENGTH} символов.`,
    MAX_IMAGE_SIZE: `Размер изображения не должен превышать ${LIMITS.MAX_IMAGE_SIZE_MB} МБ.`,
    INVALID_IMAGE_FORMAT: `Разрешены только изображения форматов: ${getAllowedFormatsString()}`,
};

export const checkLimits = {
    canCreateRoute: (currentRoutesCount) => {
        return currentRoutesCount < LIMITS.MAX_ROUTES;
    },

    canAddPoint: (currentPointsCount) => {
        return currentPointsCount < LIMITS.MAX_POINTS_PER_ROUTE;
    },

    canAddImage: (currentImagesCount) => {
        return currentImagesCount < LIMITS.MAX_IMAGES_PER_POINT;
    },

    isTextLengthValid: (text, maxLength) => {
        if (!text) return true;
        return text.length <= maxLength;
    },

    isImageSizeValid: (sizeInBytes) => {
        return isValidImageSize(sizeInBytes);
    },

    isImageFormatValid: (fileName) => {
        return isValidImageExtension(fileName);
    }
};
