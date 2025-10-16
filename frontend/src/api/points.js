// src/api/points.js
import api from './apiClient';

/**
 * Преобразует строку Data URL (Base64) в объект Blob.
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
    console.error("Error converting Data URL to Blob:", e);
    return null;
  }
};

/**
 * API для работы с точками
 */
export const pointsApi = {
  /**
   * Загрузить изображения для точки
   * @param {number} pointId - ID точки
   * @param {Array<string>} base64Images - Массив Base64-изображений
   */
  uploadImages: async (pointId, base64Images) => {
    console.log(`Uploading images for point ${pointId}:`, base64Images);

    const formData = new FormData();

    base64Images.forEach((base64String, index) => {
      console.log(`Converting image ${index}:`, base64String.substring(0, 100) + '...');

      const blob = dataURLtoBlob(base64String);

      if (blob) {
        console.log(`Successfully converted image ${index} to blob:`, blob);
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

    try {
      const response = await api.post(`points/${pointId}/upload_image/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  }
};
