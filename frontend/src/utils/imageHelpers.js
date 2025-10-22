/**
 * Обработка изображений точки - унификация формата
 * Преобразует различные форматы изображений в единый массив URL строк
 *
 * @param {Array} images - Массив изображений в различных форматах
 * @returns {Array<string>} Массив URL строк изображений
 */
export const processImages = (images) => {
    console.log('🖼️ processImages called with:', images);

    if (!images || !Array.isArray(images)) {
        console.warn('⚠️ processImages: invalid input, returning empty array');
        return [];
    }

    const processedImages = [];

    images.forEach((img, index) => {
        console.log(`   Processing image ${index + 1}:`, img);

        // Объект с полем image (из Django API)
        if (img && typeof img === 'object' && img.image) {
            let imageUrl = img.image;

            // Если URL относительный, добавляем базовый URL
            if (imageUrl.startsWith('/media/')) {
                const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
                imageUrl = `${API_BASE_URL}${imageUrl}`;
            }

            console.log(`   ✅ Image ${index + 1}: URL from object - ${imageUrl}`);
            processedImages.push(imageUrl);
        }
        // Строка - URL или Base64
        else if (typeof img === 'string') {
            if (img.startsWith('data:image/')) {
                console.log(`   ✅ Image ${index + 1}: base64 data`);
                processedImages.push(img);
            } else if (img.startsWith('http://') || img.startsWith('https://')) {
                console.log(`   ✅ Image ${index + 1}: full URL string`);
                processedImages.push(img);
            } else if (img.startsWith('/media/')) {
                const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
                const fullUrl = `${API_BASE_URL}${img}`;
                console.log(`   ✅ Image ${index + 1}: relative URL converted to ${fullUrl}`);
                processedImages.push(fullUrl);
            } else {
                console.warn(`   ⚠️ Image ${index + 1}: unknown string format:`, img.substring(0, 50));
            }
        }
        // Неизвестный формат
        else {
            console.warn(`   ⚠️ Image ${index + 1}: unknown format, skipping`);
        }
    });

    console.log('✅ processImages result:', processedImages.length, 'valid images');
    return processedImages;
};

/**
 * Получить первое изображение из массива
 * @param {Array} images - Массив изображений
 * @returns {string|null} URL первого изображения или null
 */
export const getFirstImage = (images) => {
    const processed = processImages(images);
    return processed.length > 0 ? processed[0] : null;
};

/**
 * Проверка, есть ли изображения
 * @param {Array} images - Массив изображений
 * @returns {boolean}
 */
export const hasImages = (images) => {
    const processed = processImages(images);
    return processed.length > 0;
};

/**
 * Получить количество изображений
 * @param {Array} images - Массив изображений
 * @returns {number}
 */
export const getImagesCount = (images) => {
    const processed = processImages(images);
    return processed.length;
};
