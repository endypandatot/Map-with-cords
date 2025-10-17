
// Импорты должны быть в начале файла
import { routesApi } from './routes';
import { pointsApi } from './points';

// Экспортируем базовый клиент и константы
export { default as apiClient, API_BASE_URL } from './client';

// Экспортируем API модули
export { routesApi } from './routes';
export { pointsApi } from './points';

// Объединенный API объект для удобства
export const api = {
  routes: routesApi,
  points: pointsApi,
};

// Для обратной совместимости со старым кодом
// Экспортируем routeApi, который использовался ранее
export const routeApi = {
  // Маршруты
  getRoutes: routesApi.getAll,
  getRoute: routesApi.getById,
  createRoute: routesApi.create,
  updateRoute: routesApi.update,
  deleteRoute: routesApi.delete,

  // Точки
  uploadPointImage: pointsApi.uploadImages,

  // Утилиты
  fetchCsrfToken: async () => {
    try {
      await routesApi.getAll();
      console.log('✅ CSRF token fetched successfully');
    } catch (error) {
      console.error('❌ Failed to fetch CSRF token:', error);
    }
  }
};

export default api;
