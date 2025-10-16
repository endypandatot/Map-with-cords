// src/api.js
import axios from 'axios';


export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

// Функция для получения CSRF-токена из cookie
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use(
  config => {
    // Добавляем CSRF-токен для небезопасных методов
    if (['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
      const csrfToken = getCookie('csrftoken');
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      } else {
        console.warn('⚠️ CSRF token not found in cookies');
      }
    }

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

// Interceptor для логирования всех ответов
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

  fetchCsrfToken: async () => {
    try {
      // Делаем GET-запрос на любой endpoint, чтобы получить CSRF cookie
      await api.get('routes/');
      console.log('✅ CSRF token fetched successfully');
    } catch (error) {
      console.error('❌ Failed to fetch CSRF token:', error);
    }
  }
};

export default api;
