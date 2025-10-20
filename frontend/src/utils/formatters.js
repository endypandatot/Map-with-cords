/**
 * Конвертирует десятичные координаты в формат градусы-минуты-секунды
 * @param {number} decimal - Десятичное значение координаты
 * @returns {string} - Координата в формате DMS
 */
export const decimalToDMS = (decimal) => {
    if (typeof decimal !== 'number' || isNaN(decimal)) {
        return '—';
    }

    const absolute = Math.abs(decimal);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(2);

    return `${degrees}° ${minutes}' ${seconds}"`;
};

/**
 * Форматирует координату для отображения (6 знаков после запятой)
 * @param {number|string} coord - Координата
 * @returns {string} - Отформатированная координата
 */
export const formatCoordinate = (coord) => {
    const num = parseFloat(coord);
    return isNaN(num) ? '—' : num.toFixed(6);
};

/**
 * Обрезает текст до указанной длины с добавлением многоточия
 * @param {string} text - Исходный текст
 * @param {number} maxLength - Максимальная длина
 * @returns {string} - Обрезанный текст
 */
export const truncateText = (text, maxLength) => {
    if (!text || text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength) + '...';
};
