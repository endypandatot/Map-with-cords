import { API_BASE_URL } from '../api/client';

/**
 * Проверяет, является ли строка валидным URL изображения
 */
export const isValidImageURL = (url) => {
  if (typeof url !== 'string' || url.trim() === '') return false;
  return url.startsWith('http') || url.startsWith('data:image') || url.startsWith('/media');
};

/**
 * Обрабатывает массив изображений из API в готовые URL
 * Универсальная функция для всех компонентов
 */
export const processImages = (images) => {
  if (!Array.isArray(images)) return [];

  return images
    .map(img => {
      // Уже готовый URL
      if (typeof img === 'string' && (img.startsWith('http') || img.startsWith('data:image'))) {
        return img;
      }

      // Объект с полем image
      if (typeof img === 'object' && img !== null && img.image) {
        return img.image.startsWith('http')
          ? img.image
          : `${API_BASE_URL}${img.image}`;
      }

      // Относительный путь
      if (typeof img === 'string' && img.startsWith('/')) {
        return `${API_BASE_URL}${img}`;
      }

      console.warn('Unknown image format:', img);
      return null;
    })
    .filter(Boolean);
};

/**
 * Обрабатывает точки маршрута, преобразуя изображения
 */
export const processRoutePoints = (points) => {
  if (!Array.isArray(points)) return [];

  return points.map(point => ({
    ...point,
    images: processImages(point.images || [])
  }));
};

/**
 * Обрабатывает маршруты с вложенными точками
 */
export const processRoutes = (routes) => {
  if (!Array.isArray(routes)) return [];

  return routes.map(route => ({
    ...route,
    points: processRoutePoints(route.points || [])
  }));
};
