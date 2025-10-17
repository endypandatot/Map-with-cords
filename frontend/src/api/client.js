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

// Создание единого axios instance
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/`,
  withCredentials: true,
});

// Request interceptor - добавляем CSRF токен и устанавливаем Content-Type
apiClient.interceptors.request.use(
  config => {
    if (!config.headers['Content-Type']) {
      // Если передаётся FormData, не устанавливаем Content-Type (браузер сделает это сам)
      if (!(config.data instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
      }
    } else if (config.headers['Content-Type'] === undefined) {
      // Если Content-Type явно установлен в undefined, удаляем его
      delete config.headers['Content-Type'];
    }

    // Добавляем CSRF токен для небезопасных методов
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
      contentType: config.headers['Content-Type'],
      isFormData: config.data instanceof FormData,
      data: config.data instanceof FormData ? '[FormData]' : config.data
    });
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - обработка ответов
apiClient.interceptors.response.use(
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

export default apiClient;
