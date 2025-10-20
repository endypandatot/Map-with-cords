import { API_BASE_URL } from '../api';

/**
 * Обрабатывает массив изображений и возвращает корректные URL
 * @param {Array} images - массив изображений (могут быть строками, объектами или base64)
 * @returns {Array} - массив URL изображений
 */
export const processImages = (images) => {
    console.log('🖼️ processImages called with:', images);

    if (!Array.isArray(images)) {
        console.warn('⚠️ processImages: images is not an array', images);
        return [];
    }

    const processed = images
        .map((img, index) => {
            console.log(`   Processing image ${index + 1}:`, img);

            // Если это уже строка (URL или base64)
            if (typeof img === 'string') {
                // Если это base64 - возвращаем как есть
                if (img.startsWith('data:image')) {
                    console.log(`   ✅ Image ${index + 1}: base64 data`);
                    return img;
                }

                // Если это относительный путь, добавляем базовый URL
                if (img.startsWith('/media/')) {
                    const fullUrl = `${API_BASE_URL}${img}`;
                    console.log(`   ✅ Image ${index + 1}: ${fullUrl}`);
                    return fullUrl;
                }

                // Если это уже полный URL
                if (img.startsWith('http://') || img.startsWith('https://')) {
                    console.log(`   ✅ Image ${index + 1}: full URL`);
                    return img;
                }

                console.log(`   ✅ Image ${index + 1}: ${img}`);
                return img;
            }

            // Если это объект с полем image
            if (typeof img === 'object' && img !== null) {
                if (img.image) {
                    const imagePath = img.image;

                    // Если путь относительный, добавляем базовый URL
                    if (typeof imagePath === 'string') {
                        if (imagePath.startsWith('data:image')) {
                            console.log(`   ✅ Image ${index + 1}: base64 from object`);
                            return imagePath;
                        }

                        if (imagePath.startsWith('/media/')) {
                            const fullUrl = `${API_BASE_URL}${imagePath}`;
                            console.log(`   ✅ Image ${index + 1}: ${fullUrl}`);
                            return fullUrl;
                        }

                        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
                            console.log(`   ✅ Image ${index + 1}: full URL from object`);
                            return imagePath;
                        }

                        console.log(`   ✅ Image ${index + 1}: ${imagePath}`);
                        return imagePath;
                    }
                }
            }

            console.warn(`   ⚠️ Unknown image format at index ${index}:`, img);
            return null;
        })
        .filter(Boolean);

    console.log(`✅ processImages result: ${processed.length} valid images`);
    return processed;
};

/**
 * Обрабатывает массив маршрутов и их точки с изображениями
 * @param {Array} routesData - массив маршрутов
 * @returns {Array} - обработанные маршруты
 */
export const processRoutes = (routesData) => {
    console.log('🗺️ processRoutes called with:', routesData);

    if (!Array.isArray(routesData)) {
        console.error('❌ processRoutes: data is not an array');
        return [];
    }

    const processed = routesData.map((route, routeIndex) => {
        console.log(`   Processing route ${routeIndex + 1}: ${route.name}`);

        const processedPoints = (route.points || []).map((point, pointIndex) => {
            console.log(`      Processing point ${pointIndex + 1}: ${point.name}`);
            const processedImages = processImages(point.images || []);

            return {
                ...point,
                images: processedImages
            };
        });

        return {
            ...route,
            points: processedPoints
        };
    });

    console.log(`✅ processRoutes result: ${processed.length} routes processed`);
    return processed;
};
