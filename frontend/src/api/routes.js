// src/api/routes.js
import api from './apiClient';

/**
 * API для работы с маршрутами
 */
export const routesApi = {
  /**
   * Получить все маршруты
   */
  getAll: async () => {
    try {
      const response = await api.get('routes/');

      let routesData;
      if (response.data.results && Array.isArray(response.data.results)) {
        routesData = response.data.results;
      } else if (Array.isArray(response.data)) {
        routesData = response.data;
      } else {
        console.error('Unexpected response format:', response.data);
        routesData = [];
      }

      return routesData;
    } catch (error) {
      console.error('Error fetching routes:', error);
      throw error;
    }
  },

  /**
   * Создать новый маршрут
   * @param {Object} routeData - Данные маршрута
   */
  create: async (routeData) => {
    try {
      const response = await api.post('routes/', routeData);
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
   */
  update: async (routeId, routeData) => {
    try {
      const response = await api.put(`routes/${routeId}/`, routeData);
      return response.data;
    } catch (error) {
      console.error('Error updating route:', error);
      throw error;
    }
  },

  /**
   * Удалить маршрут
   * @param {number} routeId - ID маршрута
   */
  delete: async (routeId) => {
    try {
      await api.delete(`routes/${routeId}/`);
    } catch (error) {
      console.error('Error deleting route:', error);
      throw error;
    }
  }
};
