// src/utils/validation.js

/**
 * Валидация координат (широты и долготы)
 * @param {string|number} lat - Широта
 * @param {string|number} lon - Долгота
 * @returns {{valid: boolean, message: string}}
 */
export const validateCoordinates = (lat, lon) => {
    if (!lat || !lon || lat.toString().trim() === '' || lon.toString().trim() === '') {
        return { valid: false, message: '' };
    }

    const decimalFormatRegex = /^-?\d{2,3}\.\d{6}$/;

    if (!decimalFormatRegex.test(lat.toString().trim())) {
        return { valid: false, message: 'Не корректные данные координат точки, попробуйте снова' };
    }

    if (!decimalFormatRegex.test(lon.toString().trim())) {
        return { valid: false, message: 'Не корректные данные координат точки, попробуйте снова' };
    }

    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);

    if (isNaN(latNum) || isNaN(lonNum)) {
        return { valid: false, message: 'Не корректные данные координат точки, попробуйте снова' };
    }

    if (latNum < -90 || latNum > 90) {
        return { valid: false, message: 'Не корректные данные координат точки, попробуйте снова' };
    }

    if (lonNum < -180 || lonNum > 180) {
        return { valid: false, message: 'Не корректные данные координат точки, попробуйте снова' };
    }

    return { valid: true, message: '' };
};

/**
 * Валидация длины текста
 * @param {string} text - Текст
 * @param {number} maxLength - Максимальная длина
 * @returns {boolean}
 */
export const isTextLengthValid = (text, maxLength) => {
    if (!text) return true;
    return text.length <= maxLength;
};
