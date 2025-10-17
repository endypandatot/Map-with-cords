import apiClient from './client';

/**
 * Сжимает изображение до указанного размера
 * @param {string} dataUrl - Data URL изображения
 * @param {number} maxSizeMB - Максимальный размер в МБ
 * @returns {Promise<string>} Сжатое изображение в формате Data URL
 */
const compressImage = async (dataUrl, maxSizeMB = 0.9) => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Максимальные размеры для сжатия
      const MAX_WIDTH = 1920;
      const MAX_HEIGHT = 1920;

      // Уменьшаем размеры, сохраняя пропорции
      if (width > height) {
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      let quality = 0.9;
      let compressed = canvas.toDataURL('image/jpeg', quality);

      // Проверяем размер и уменьшаем качество при необходимости
      const targetSize = maxSizeMB * 1024 * 1024;
      let iterations = 0;
      const maxIterations = 10;

      while (compressed.length > targetSize && quality > 0.1 && iterations < maxIterations) {
        quality -= 0.1;
        compressed = canvas.toDataURL('image/jpeg', quality);
        iterations++;
        console.log(`   🔄 Compression iteration ${iterations}: quality=${quality.toFixed(1)}, size=${(compressed.length / (1024 * 1024)).toFixed(2)} MB`);
      }

      console.log(`   ✅ Compression done: ${(compressed.length / (1024 * 1024)).toFixed(2)} MB, quality=${quality.toFixed(1)}`);
      resolve(compressed);
    };

    img.onerror = (error) => {
      console.error('Error loading image for compression:', error);
      reject(error);
    };

    img.src = dataUrl;
  });
};

/**
 * Преобразует строку Data URL (Base64) в объект Blob
 * @param {string} dataurl - Data URL строка
 * @returns {Blob|null} Blob объект или null
 */
const dataURLtoBlob = (dataurl) => {
  try {
    if (!dataurl || typeof dataurl !== 'string') {
      console.error('Invalid dataurl:', dataurl);
      return null;
    }

    if (!dataurl.startsWith('data:')) {
      console.error('Not a data URL:', dataurl.substring(0, 50));
      return null;
    }

    const arr = dataurl.split(',');
    if (arr.length !== 2) {
      console.error('Invalid data URL format');
      return null;
    }

    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
      console.error('Cannot extract MIME type');
      return null;
    }

    const mime = mimeMatch[1];

    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    const blob = new Blob([u8arr], { type: mime });
    return blob;
  } catch (e) {
    console.error("❌ Error converting Data URL to Blob:", e);
    return null;
  }
};

/**
 * API для работы с точками маршрута
 */
export const pointsApi = {
  /**
   * Получить все точки маршрута
   * @param {number} routeId - ID маршрута
   * @returns {Promise} Массив точек
   */
  getByRoute: async (routeId) => {
    try {
      const response = await apiClient.get(`routes/${routeId}/points/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching points for route ${routeId}:`, error);
      throw error;
    }
  },

  /**
   * Получить точку по ID
   * @param {number} pointId - ID точки
   * @returns {Promise} Данные точки
   */
  getById: async (pointId) => {
    try {
      const response = await apiClient.get(`points/${pointId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching point ${pointId}:`, error);
      throw error;
    }
  },

  /**
   * Создать новую точку
   * @param {Object} pointData - Данные точки
   * @returns {Promise} Созданная точка
   */
  create: async (pointData) => {
    try {
      const response = await apiClient.post('points/', pointData);
      console.log('✅ Point created:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating point:', error);
      throw error;
    }
  },

  /**
   * Обновить точку
   * @param {number} pointId - ID точки
   * @param {Object} pointData - Новые данные точки
   * @returns {Promise} Обновленная точка
   */
  update: async (pointId, pointData) => {
    try {
      const response = await apiClient.put(`points/${pointId}/`, pointData);
      console.log('✅ Point updated:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error updating point ${pointId}:`, error);
      throw error;
    }
  },

  /**
   * Удалить точку
   * @param {number} pointId - ID точки
   * @returns {Promise}
   */
  delete: async (pointId) => {
    try {
      await apiClient.delete(`points/${pointId}/`);
      console.log(`✅ Point ${pointId} deleted`);
    } catch (error) {
      console.error(`Error deleting point ${pointId}:`, error);
      throw error;
    }
  },

  /**
   * Загрузить изображения для точки
   * @param {number} pointId - ID точки
   * @param {Array<string>} base64Images - Массив Base64 изображений
   * @returns {Promise} Результат загрузки
   */
  uploadImages: async (pointId, base64Images) => {
    console.log(`\n📤 ========== UPLOAD IMAGES START ==========`);
    console.log(`Point ID: ${pointId}`);
    console.log(`Point ID type: ${typeof pointId}`);
    console.log(`Images count: ${base64Images?.length || 0}`);

    if (!base64Images || !Array.isArray(base64Images)) {
      console.error('❌ base64Images is not an array:', base64Images);
      throw new Error('base64Images must be an array');
    }

    if (base64Images.length === 0) {
      console.warn('⚠️ No images to upload (empty array)');
      return { message: 'No images to upload', uploaded: 0 };
    }

    const formData = new FormData();
    let successCount = 0;
    let failCount = 0;

    const MAX_SIZE_MB = 0.9; // Оставляем запас

    // Конвертируем Base64 в Blob и добавляем в FormData
    for (let index = 0; index < base64Images.length; index++) {
      let base64String = base64Images[index];

      console.log(`\n🔄 Processing image ${index + 1}/${base64Images.length}`);

      if (typeof base64String !== 'string') {
        console.error(`❌ Image ${index + 1} is not a string:`, base64String);
        failCount++;
        continue;
      }

      console.log(`Original size: ${(base64String.length / (1024 * 1024)).toFixed(2)} MB`);

      try {
        const originalSizeMB = base64String.length / (1024 * 1024);

        if (originalSizeMB > MAX_SIZE_MB) {
          console.log(`   ⚠️ Image too large (${originalSizeMB.toFixed(2)} MB), compressing...`);
          base64String = await compressImage(base64String, MAX_SIZE_MB);
          const newSizeMB = base64String.length / (1024 * 1024);
          console.log(`   ✅ Compressed: ${originalSizeMB.toFixed(2)} MB → ${newSizeMB.toFixed(2)} MB`);
        }
      } catch (compressionError) {
        console.error(`❌ Compression failed for image ${index + 1}:`, compressionError);
        failCount++;
        continue;
      }

      const blob = dataURLtoBlob(base64String);

      if (blob) {
        const sizeInMB = blob.size / (1024 * 1024);
        console.log(`✅ Image ${index + 1} converted successfully`);
        console.log(`   - Size: ${sizeInMB.toFixed(2)} MB`);
        console.log(`   - Type: ${blob.type}`);

        // Финальная проверка размера
        if (sizeInMB > 1.0) {
          console.error(`❌ Image ${index + 1} still too large: ${sizeInMB.toFixed(2)} MB (max 1 MB)`);
          failCount++;
          continue;
        }

        // Генерируем имя файла
        const extension = blob.type.split('/')[1] || 'jpg';
        const filename = `image_${Date.now()}_${index}.${extension}`;

        formData.append('images', blob, filename);
        console.log(`   - Filename: ${filename}`);
        console.log(`   - Added to FormData with key: "images"`);
        successCount++;
      } else {
        console.error(`❌ Failed to convert image ${index + 1}`);
        failCount++;
      }
    }

    console.log(`\n📊 Conversion summary:`);
    console.log(`   - Success: ${successCount}`);
    console.log(`   - Failed: ${failCount}`);

    if (successCount === 0) {
      console.error('❌ No images were successfully converted');
      throw new Error('Failed to convert any images');
    }

    // Логируем содержимое FormData
    console.log('\n📦 FormData contents:');
    let entryCount = 0;
    for (let pair of formData.entries()) {
      entryCount++;
      const [key, value] = pair;
      if (value instanceof Blob) {
        console.log(`   ${entryCount}. Key: "${key}", Value: Blob(${value.size} bytes, ${value.type})`);
      } else if (value instanceof File) {
        console.log(`   ${entryCount}. Key: "${key}", Value: File("${value.name}", ${value.size} bytes, ${value.type})`);
      } else {
        console.log(`   ${entryCount}. Key: "${key}", Value:`, value);
      }
    }
    console.log(`Total FormData entries: ${entryCount}`);

    try {
      const url = `points/${pointId}/upload_image/`;
      console.log(`\n🚀 Sending POST request to: ${url}`);

      const config = {
        headers: {
          'Content-Type': undefined
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`📊 Upload progress: ${percentCompleted}%`);
        }
      };

      const response = await apiClient.post(url, formData, config);

      console.log('✅ Images uploaded successfully');
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      console.log(`========== UPLOAD IMAGES END ==========\n`);

      return response.data;
    } catch (error) {
      console.error('\n❌ ========== UPLOAD IMAGES ERROR ==========');
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });

      if (error.response?.data) {
        console.error('Django error response:', JSON.stringify(error.response.data, null, 2));
      }

      console.error(`========== UPLOAD IMAGES ERROR END ==========\n`);
      throw error;
    }
  },

  /**
   * Удалить изображение точки
   * @param {number} imageId - ID изображения
   * @returns {Promise}
   */
  deleteImage: async (imageId) => {
    try {
      await apiClient.delete(`point-images/${imageId}/`);
      console.log(`✅ Image ${imageId} deleted`);
    } catch (error) {
      console.error(`Error deleting image ${imageId}:`, error);
      throw error;
    }
  }
};
