// src/utils/formatters.js

export const parseDecimalCoordinate = (value) => {
    if (typeof value !== 'string' || value.trim() === '') return '';

    const trimmed = value.trim();
    const decimalRegex = /^-?\d*\.?\d*$/;

    if (!decimalRegex.test(trimmed)) return '';

    // ИСПРАВЛЕНО: Ограничиваем до 6 знаков после запятой
    if (trimmed.includes('.')) {
        const parts = trimmed.split('.');
        if (parts[1] && parts[1].length > 6) {
            return `${parts[0]}.${parts[1].substring(0, 6)}`;
        }
    }

    return trimmed;
};

export const decimalToDMS = (decimal) => {
    if (isNaN(decimal) || decimal === '' || decimal === null) return '';

    const absolute = Math.abs(decimal);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = Math.floor((minutesNotTruncated - minutes) * 60);

    return `${degrees}°${minutes}'${seconds}"`;
};

export const formatCoord = (coord) => {
    const num = parseFloat(coord);
    return isNaN(num) ? '—' : num.toFixed(6);
};

export const escapeHtml = (text) => {
    if (!text) return '';
    return text.toString().replace(/[<>&"']/g, '');
};

export const truncateText = (text, maxLength) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};