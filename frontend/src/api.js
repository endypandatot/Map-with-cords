export {
  routeApi,           // Старый API (обратная совместимость)
  routesApi,          // Новый модульный API для маршрутов
  pointsApi,          // Новый модульный API для точек
  API_BASE_URL,       // Базовый URL
  apiClient,          // Axios клиент
  api                 // Объединенный API объект
} from './api/index';

// Default export для обратной совместимости
export { routeApi as default } from './api/index';
