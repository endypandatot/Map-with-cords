// src/api.js
import axios from 'axios';

export const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавим interceptor для логирования всех запросов
api.interceptors.request.use(
  config => {
    console.log('API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      data: config.data,
      headers: config.headers
    });
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Добавим interceptor для логирования всех ответов
api.interceptors.response.use(
  response => {
    console.log('API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  error => {
    console.error('API Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

/**
 * Преобразует строку Data URL (Base64) в объект Blob.
 * @param {string} dataurl - Строка в формате "data:image/png;base64,..."
 * @returns {Blob|null} - Объект Blob или null в случае ошибки.
 */
const dataURLtoBlob = (dataurl) => {
  try {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;

    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new Blob([u8arr], { type: mime });
  } catch (e) {
    console.error("Ошибка при преобразовании Data URL в Blob:", e);
    return null;
  }
};

export const routeApi = {
  getRoutes: () => api.get('routes/'),
  createRoute: (routeData) => api.post('routes/', routeData),
  updateRoute: (routeId, routeData) => api.put(`routes/${routeId}/`, routeData),
  deleteRoute: (routeId) => api.delete(`routes/${routeId}/`),

  uploadPointImage: (pointId, base64Images) => {
    console.log(`Uploading images for point ${pointId}:`, base64Images);

    const formData = new FormData();

    base64Images.forEach((base64String, index) => {
      console.log(`Converting image ${index}:`, base64String.substring(0, 100) + '...');

      // Преобразуем каждую строку Base64 в Blob
      const blob = dataURLtoBlob(base64String);

      if (blob) {
        console.log(`Successfully converted image ${index} to blob:`, blob);
        // Добавляем Blob в formData как файл
        // Используем правильное имя поля 'images' (множественное число)
        formData.append('images', blob, `image_${index}.png`);
      } else {
        console.error(`Failed to convert image ${index} to blob`);
      }
    });

    // Логируем содержимое FormData
    console.log('FormData entries:');
    for (let pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    return api.post(`points/${pointId}/upload_image/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default api;