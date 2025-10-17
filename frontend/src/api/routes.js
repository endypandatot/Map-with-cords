import apiClient from './client';

/**
 * API для работы с маршрутами
 */
export const routesApi = {
  /**
   * Получить все маршруты
   * @returns {Promise} Массив маршрутов
   */
  getAll: async () => {
    try {
      const response = await apiClient.get('routes/');

      // Обработка разных форматов ответа (пагинация или массив)
      let routesData;
      if (response.data.results && Array.isArray(response.data.results)) {
        console.log('📊 Paginated response detected');
        routesData = response.data.results;
      } else if (Array.isArray(response.data)) {
        console.log('📊 Array response detected');
        routesData = response.data;
      } else {
        console.error('❌ Unexpected response format:', response.data);
        routesData = [];
      }

      return routesData;
    } catch (error) {
      console.error('Error fetching routes:', error);
      throw error;
    }
  },

  /**
   * Получить маршрут по ID
   * @param {number} routeId - ID маршрута
   * @returns {Promise} Данные маршрута
   */
  getById: async (routeId) => {
    try {
      const response = await apiClient.get(`routes/${routeId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching route ${routeId}:`, error);
      throw error;
    }
  },

  /**
   * Создать новый маршрут
   * @param {Object} routeData - Данные маршрута
   * @returns {Promise} Созданный маршрут
   */
  create: async (routeData) => {
    try {
      const response = await apiClient.post('routes/', routeData);
      console.log('✅ Route created:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating route:', error);
      throw error;
    }
  },

  /**
   * Обновить маршрут
   * @param {number} routeId - ID маршрута
   * @param {Object} routeData - Новые данные маршрута
   * @returns {Promise} Обновленный маршрут
   */
  update: async (routeId, routeData) => {
    try {
      const response = await apiClient.put(`routes/${routeId}/`, routeData);
      console.log('✅ Route updated:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error updating route ${routeId}:`, error);
      throw error;
    }
  },

  /**
   * Частично обновить маршрут
   * @param {number} routeId - ID маршрута
   * @param {Object} partialData - Частичные данные для обновления
   * @returns {Promise} Обновленный маршрут
   */
  patch: async (routeId, partialData) => {
    try {
      const response = await apiClient.patch(`routes/${routeId}/`, partialData);
      console.log('✅ Route patched:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error patching route ${routeId}:`, error);
      throw error;
    }
  },

  /**
   * Удалить маршрут
   * @param {number} routeId - ID маршрута
   * @returns {Promise}
   */
  delete: async (routeId) => {
    try {
      await apiClient.delete(`routes/${routeId}/`);
      console.log(`✅ Route ${routeId} deleted`);
    } catch (error) {
      console.error(`Error deleting route ${routeId}:`, error);
      throw error;
    }
  }
};
