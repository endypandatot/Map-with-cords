// src/utils/imageHelpers.js
import { API_BASE_URL } from '../api/apiClient';

/**
 * Обрабатывает массив изображений, преобразуя объекты в URL
 * @param {Array} images - Массив изображений (строки или объекты)
 * @returns {Array<string>} - Массив URL изображений
 */
export const processImages = (images) => {
  if (!Array.isArray(images)) return [];

  return images
    .map(img => {
      // Если это уже готовая строка (data:image или http://...), используем её
      if (typeof img === 'string') {
        return img;
      }
      // Если это объект от сервера { image: '/path/...' }, строим полный URL
      if (typeof img === 'object' && img !== null && img.image) {
        return img.image.startsWith('http')
          ? img.image
          : `${API_BASE_URL}${img.image}`;
      }
      return null;
    })
    .filter(Boolean); // Убираем некорректные значения
};

/**
 * Проверяет, является ли строка валидным URL изображения
 * @param {string} url - URL для проверки
 * @returns {boolean}
 */
export const isValidImageURL = (url) => {
  if (!url || typeof url !== 'string') return false;

  try {
    // Проверяем data:image URLs
    if (url.startsWith('data:image/')) {
      return true;
    }

    // Проверяем http/https URLs
    const urlObj = new URL(url);
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      console.warn('⚠️ Invalid URL protocol:', urlObj.protocol);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Invalid URL:', url, error);
    return false;
  }
};

/**
 * Проверяет, является ли файл валидным изображением
 * @param {File} file - Файл для проверки
 * @returns {boolean}
 */
export const isValidImageFile = (file) => {
  const validMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/svg+xml',
    'image/tiff',
    'image/heic',
    'image/heif'
  ];

  const validExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    '.bmp', '.svg', '.tiff', '.tif', '.heic', '.heif'
  ];

  const mimeTypeValid = validMimeTypes.includes(file.type.toLowerCase());
  const fileName = file.name.toLowerCase();
  const extensionValid = validExtensions.some(ext => fileName.endsWith(ext));

  return mimeTypeValid && extensionValid;
};

/**
 * Проверяет файл изображения по сигнатуре (magic bytes)
 * @param {File} file - Файл для проверки
 * @returns {Promise<{isValid: boolean, detectedType: string|null}>}
 */
export const checkFileSignature = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = (e) => {
      if (!e.target.result) {
        reject(new Error('Не удалось прочитать файл'));
        return;
      }

      const arr = new Uint8Array(e.target.result);

      // Словарь сигнатур файлов изображений (первые байты)
      const signatures = {
        jpeg: [0xFF, 0xD8, 0xFF],
        png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
        gif87a: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
        gif89a: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
        webp: [0x52, 0x49, 0x46, 0x46],
        bmp: [0x42, 0x4D],
        tiffLE: [0x49, 0x49, 0x2A, 0x00],
        tiffBE: [0x4D, 0x4D, 0x00, 0x2A],
        ico: [0x00, 0x00, 0x01, 0x00],
        svg1: [0x3C, 0x3F, 0x78, 0x6D, 0x6C],
        svg2: [0x3C, 0x73, 0x76, 0x67],
        svg3: [0x3C, 0x21, 0x44, 0x4F, 0x43, 0x54, 0x59, 0x50, 0x45],
      };

      // Функция для проверки совпадения байтов
      const matchSignature = (fileBytes, signature) => {
        if (fileBytes.length < signature.length) return false;
        return signature.every((byte, index) => fileBytes[index] === byte);
      };

      // Проверяем все известные сигнатуры
      for (const [type, signature] of Object.entries(signatures)) {
        if (matchSignature(arr, signature)) {
          // Дополнительная проверка для WebP
          if (type === 'webp') {
            const webpCheck = arr.length >= 12 &&
                            arr[8] === 0x57 &&
                            arr[9] === 0x45 &&
                            arr[10] === 0x42 &&
                            arr[11] === 0x50;
            if (webpCheck) {
              resolve({ isValid: true, detectedType: 'image/webp' });
              return;
            }
          } else {
            resolve({ isValid: true, detectedType: type });
            return;
          }
        }
      }

      // Если не найдена ни одна сигнатура изображения
      resolve({ isValid: false, detectedType: null });
    };

    reader.onerror = () => {
      reject(new Error('Ошибка чтения файла'));
    };

    // Читаем первые 20 байт файла
    const blob = file.slice(0, 20);
    reader.readAsArrayBuffer(blob);
  });
};

/**
 * Форматирует размер файла в человекочитаемый вид
 * @param {number} bytes - Размер в байтах
 * @returns {string}
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
