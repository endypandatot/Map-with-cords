import React, { useState, useEffect, useCallback } from 'react';
import SaveIcon from './SvgIcons/SaveIcon';
import CancelIcon from './SvgIcons/CancelIcon';
import { LIMITS, LIMIT_MESSAGES, checkLimits, formatters } from '../constants/limits';

const parseDecimalCoordinate = (value) => {
    if (typeof value !== 'string' || value.trim() === '') return '';

    const trimmed = value.trim();
    const decimalRegex = /^-?\d+\.?\d*$/;

    if (!decimalRegex.test(trimmed)) {
        return '';
    }

    if (trimmed.includes('.')) {
        const parts = trimmed.split('.');
        if (parts[1] && parts[1].length > 6) {
            return `${parts[0]}.${parts[1].substring(0, 6)}`;
        }
    }

    return trimmed;
};

// ФУНКЦИЯ: валидация координат
const validateCoordinates = (lat, lon) => {
    if (!lat || !lon || lat.trim() === '' || lon.trim() === '') {
        return { valid: false, message: '' };
    }

    const decimalFormatRegex = /^-?\d{2,3}\.\d{6}$/;

    if (!decimalFormatRegex.test(lat.trim())) {
        return { valid: false, message: 'Не корректные данные координат точки, попробуйте снова' };
    }

    if (!decimalFormatRegex.test(lon.trim())) {
        return { valid: false, message: 'Не корректные данные координат точки, попробуйте снова' };
    }

    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);

    if (isNaN(latNum) || isNaN(lonNum)) {
        return { valid: false, message: 'Не корректные данные координат точки, попробуйте снова' };
    }

    if (latNum < -90 || latNum > 90) {
        return { valid: false, message: 'Не корректные данные координат точки, попробуйте снова' };
    }

    if (lonNum < -180 || lonNum > 180) {
        return { valid: false, message: 'Не корректные данные координат точки, попробуйте снова' };
    }

    return { valid: true, message: '' };
};

const checkFileSignature = (file) => {
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
                // JPEG: FF D8 FF
                jpeg: [0xFF, 0xD8, 0xFF],
                // PNG: 89 50 4E 47 0D 0A 1A 0A
                png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
                // GIF: 47 49 46 38 (GIF8)
                gif87a: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
                gif89a: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
                // WebP: 52 49 46 46 ... 57 45 42 50 (RIFF....WEBP)
                webp: [0x52, 0x49, 0x46, 0x46],
                // BMP: 42 4D
                bmp: [0x42, 0x4D],
                // TIFF: 49 49 2A 00 (little-endian) или 4D 4D 00 2A (big-endian)
                tiffLE: [0x49, 0x49, 0x2A, 0x00],
                tiffBE: [0x4D, 0x4D, 0x00, 0x2A],
                // ICO: 00 00 01 00
                ico: [0x00, 0x00, 0x01, 0x00],
                // SVG: начинается с XML или !DOCTYPE или <svg
                svg1: [0x3C, 0x3F, 0x78, 0x6D, 0x6C], // <?xml
                svg2: [0x3C, 0x73, 0x76, 0x67], // <svg
                svg3: [0x3C, 0x21, 0x44, 0x4F, 0x43, 0x54, 0x59, 0x50, 0x45], // <!DOCTYPE
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
                        // WebP имеет "WEBP" на позициях 8-11
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

        // Читаем первые 20 байт файла (достаточно для определения типа)
        const blob = file.slice(0, 20);
        reader.readAsArrayBuffer(blob);
    });
};

// ФУНКЦИЯ: проверка типа файла с расширением и MIME
const isValidImageFile = (file) => {
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

function PointCreationForm({ point: initialPoint, tempCoords, onSave, onCancel }) {
    const [pointName, setPointName] = useState('');
    const [pointDescription, setPointDescription] = useState('');
    const [pointImages, setPointImages] = useState([]);
    const [pointLatitude, setPointLatitude] = useState('');
    const [pointLongitude, setPointLongitude] = useState('');
    const [latDisplay, setLatDisplay] = useState('');
    const [lonDisplay, setLonDisplay] = useState('');
    const [isSaveEnabled, setIsSaveEnabled] = useState(false);
    const [coordsError, setCoordsError] = useState('');
    const [imageError, setImageError] = useState('');

    const [existingImages, setExistingImages] = useState([]);
    const [newImages, setNewImages] = useState([]);

    useEffect(() => {
        const latDec = initialPoint?.lat ? String(initialPoint.lat) : (tempCoords?.[0] ? String(tempCoords[0]) : '');
        const lonDec = initialPoint?.lon ? String(initialPoint.lon) : (tempCoords?.[1] ? String(tempCoords[1]) : '');

        const latParsed = parseDecimalCoordinate(latDec);
        const lonParsed = parseDecimalCoordinate(lonDec);

        setPointName(initialPoint?.name || '');
        setPointDescription(initialPoint?.description || '');

        if (initialPoint?.images) {
            const existingImgs = [];
            const newImgs = [];

            initialPoint.images.forEach(img => {
                if (typeof img === 'string' && img.startsWith('data:image')) {
                    newImgs.push(img);
                } else {
                    if (typeof img === 'string') {
                        existingImgs.push(img);
                    } else if (typeof img === 'object' && img !== null && img.image) {
                        const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
                        existingImgs.push(`${baseUrl}${img.image}`);
                    }
                }
            });

            setExistingImages(existingImgs);
            setNewImages(newImgs);
            setPointImages([...existingImgs, ...newImgs]);
        } else {
            setExistingImages([]);
            setNewImages([]);
            setPointImages([]);
        }

        setPointLatitude(latParsed);
        setPointLongitude(lonParsed);
        setLatDisplay(latParsed);
        setLonDisplay(lonParsed);

        setCoordsError('');
        setImageError('');
    }, [initialPoint, tempCoords]);

    useEffect(() => {
        const nameFilled = pointName.trim() !== '';
        const latFilled = pointLatitude.trim() !== '';
        const lonFilled = pointLongitude.trim() !== '';

        if (!latFilled || !lonFilled) {
            setIsSaveEnabled(false);
            setCoordsError('');
            return;
        }

        const validation = validateCoordinates(pointLatitude, pointLongitude);

        setIsSaveEnabled(nameFilled && validation.valid);
        setCoordsError(validation.message);

    }, [pointName, pointLatitude, pointLongitude]);

    const handleLatChange = (e) => {
        const value = e.target.value;
        setLatDisplay(value);

        const decimal = parseDecimalCoordinate(value);
        setPointLatitude(decimal);

        if (decimal !== value) {
            setLatDisplay(decimal);
        }
    };

    const handleLonChange = (e) => {
        const value = e.target.value;
        setLonDisplay(value);

        const decimal = parseDecimalCoordinate(value);
        setPointLongitude(decimal);

        if (decimal !== value) {
            setLonDisplay(decimal);
        }
    };

    // ОБНОВЛЕННЫЙ ОБРАБОТЧИК с проверкой лимитов
    const handleImageUpload = useCallback(async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setImageError('');

        // ПРОВЕРКА ЛИМИТА НА КОЛИЧЕСТВО ИЗОБРАЖЕНИЙ
        const currentImagesCount = pointImages.length;
        if (!checkLimits.canAddImage(currentImagesCount)) {
            setImageError(LIMIT_MESSAGES.MAX_IMAGES);
            e.target.value = null;
            return;
        }

        const availableSlots = LIMITS.MAX_IMAGES_PER_POINT - currentImagesCount;

        if (files.length > availableSlots) {
            setImageError(`Можно загрузить еще ${availableSlots} фото (максимум ${LIMITS.MAX_IMAGES_PER_POINT} на точку)`);
            e.target.value = null;
            return;
        }

        // Базовая проверка типов файлов
        const invalidFiles = files.filter(file => !isValidImageFile(file));
        if (invalidFiles.length > 0) {
            const invalidFileNames = invalidFiles.map(f => f.name).join(', ');
            setImageError(`Недопустимый формат файла: ${invalidFileNames}. Разрешены только изображения (JPG, PNG, GIF, WEBP и др.)`);
            e.target.value = null;
            return;
        }

        // ПРОВЕРКА РАЗМЕРА ФАЙЛОВ
        const oversizedFiles = files.filter(file => !checkLimits.isImageSizeValid(file.size));
        if (oversizedFiles.length > 0) {
            const filesInfo = oversizedFiles.map(f => `${f.name} (${formatters.formatFileSize(f.size)})`).join(', ');
            setImageError(`${LIMIT_MESSAGES.MAX_IMAGE_SIZE}\nФайлы: ${filesInfo}`);
            e.target.value = null;
            return;
        }

        // ПРОВЕРКА СИГНАТУРЫ ФАЙЛОВ (magic bytes)
        try {
            const signatureChecks = await Promise.all(
                files.map(file => checkFileSignature(file))
            );

            const fakeFiles = [];
            signatureChecks.forEach((result, index) => {
                if (!result.isValid) {
                    fakeFiles.push(files[index].name);
                }
            });

            if (fakeFiles.length > 0) {
                setImageError(`Обнаружены поддельные файлы (не являются изображениями): ${fakeFiles.join(', ')}`);
                e.target.value = null;
                return;
            }
        } catch (error) {
            console.error('Ошибка проверки сигнатуры файла:', error);
            setImageError('Ошибка проверки файлов. Попробуйте снова.');
            e.target.value = null;
            return;
        }

        // Загрузка файлов
        let loadedCount = 0;
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const newImageData = event.target.result;
                setNewImages(prevNew => [...prevNew, newImageData]);
                setPointImages(prevAll => [...prevAll, newImageData]);

                loadedCount++;
                if (loadedCount === files.length) {
                    setImageError('');
                }
            };
            reader.onerror = () => {
                setImageError(`Ошибка загрузки файла: ${file.name}`);
            };
            reader.readAsDataURL(file);
        });

        e.target.value = null;
    }, [pointImages.length]);

    const handleDeleteImage = useCallback((indexToDelete) => {
        const imageToDelete = pointImages[indexToDelete];

        if (newImages.includes(imageToDelete)) {
            const newIndex = newImages.indexOf(imageToDelete);
            setNewImages(prev => prev.filter((_, idx) => idx !== newIndex));
        } else {
            const existingIndex = existingImages.indexOf(imageToDelete);
            setExistingImages(prev => prev.filter((_, idx) => idx !== existingIndex));
        }

        setPointImages(prev => prev.filter((_, idx) => idx !== indexToDelete));
        setImageError('');
    }, [pointImages, newImages, existingImages]);

    const handleSave = useCallback(() => {
        const validation = validateCoordinates(pointLatitude, pointLongitude);
        if (!validation.valid) {
            setCoordsError(validation.message || 'Не корректные данные координат точки, попробуйте снова');
            return;
        }

        if (!isSaveEnabled) return;

        const updatedPointData = {
            ...initialPoint,
            name: pointName.trim() || `Точка`,
            description: pointDescription.trim() || 'Без описания',
            lat: pointLatitude,
            lon: pointLongitude,
            images: [...existingImages, ...newImages]
        };

        onSave(updatedPointData, initialPoint?.index);
    }, [initialPoint, pointName, pointDescription, pointLatitude, pointLongitude, existingImages, newImages, onSave, isSaveEnabled]);

    const imagesToShow = pointImages.slice(0, 4);
    const remainingCount = pointImages.length - imagesToShow.length;
    const canUploadMore = pointImages.length < LIMITS.MAX_IMAGES_PER_POINT;

    return (
        <div className="form-container">
            <div className="form-header">
                <div className="routes-title">
                    {initialPoint && initialPoint.index != null ? 'Редактирование точки' : 'Создание точки'}
                </div>
                <div className="route-form-actions">
                    <SaveIcon onClick={handleSave} disabled={!isSaveEnabled} />
                    <CancelIcon onClick={onCancel} />
                </div>
            </div>

            <input
                type="text"
                placeholder="Название точки"
                value={pointName}
                onChange={(e) => setPointName(e.target.value)}
                maxLength={LIMITS.MAX_POINT_NAME_LENGTH}
            />

            <textarea
                placeholder="Краткое описание"
                value={pointDescription}
                onChange={(e) => setPointDescription(e.target.value)}
                maxLength={LIMITS.MAX_POINT_DESCRIPTION_LENGTH}
            />

            <div className="form-coords-inputs">
                <div>
                    <input
                        type="text"
                        placeholder="Широта (например: 52.565655)"
                        value={latDisplay}
                        onChange={handleLatChange}
                        style={coordsError ? { borderColor: '#C33939' } : {}}
                        maxLength={11}
                    />
                </div>
                <div>
                    <input
                        type="text"
                        placeholder="Долгота (например: 37.369377)"
                        value={lonDisplay}
                        onChange={handleLonChange}
                        style={coordsError ? { borderColor: '#C33939' } : {}}
                        maxLength={11}
                    />
                </div>
            </div>

            <button
                className="form-upload-btn"
                onClick={() => canUploadMore && document.getElementById('fileInput').click()}
                disabled={!canUploadMore}
                style={{
                    cursor: canUploadMore ? 'pointer' : 'not-allowed',
                    opacity: canUploadMore ? 1 : 0.5
                }}
            >
                {canUploadMore
                    ? `Загрузить фото (${pointImages.length}/${LIMITS.MAX_IMAGES_PER_POINT})`
                    : `Достигнут лимит (${LIMITS.MAX_IMAGES_PER_POINT}/${LIMITS.MAX_IMAGES_PER_POINT})`
                }
            </button>

            <div style={{
                color: 'rgba(48, 55, 45, 0.60)',
                fontSize: '10px',
                marginTop: '8px',
                textAlign: 'center',
                lineHeight: '1.4'
            }}>
                Максимум {LIMITS.MAX_IMAGES_PER_POINT} фотографии. Каждая не более {LIMITS.MAX_IMAGE_SIZE_MB} МБ.
            </div>

            {coordsError && (
                <div style={{
                    color: '#C33939',
                    fontSize: '10px',
                    marginTop: '8px',
                    marginBottom: '8px',
                    textAlign: 'center'
                }}>
                    {coordsError}
                </div>
            )}

            {imageError && (
                <div style={{
                    color: '#C33939',
                    fontSize: '10px',
                    marginTop: '8px',
                    marginBottom: '8px',
                    textAlign: 'center',
                    maxWidth: '100%',
                    wordWrap: 'break-word',
                    whiteSpace: 'pre-line'
                }}>
                    {imageError}
                </div>
            )}

            <input
                id="fileInput"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/svg+xml,image/tiff,image/heic,image/heif"
                multiple={canUploadMore}
                style={{ display: 'none' }}
                onChange={handleImageUpload}
            />

            {imagesToShow.length > 0 && (
                <div className={`point-images-grid-preview count-${Math.min(imagesToShow.length, 4)}`}>
                    {imagesToShow.map((src, index) => (
                        <div key={index} className="point-image-grid-item">
                            <img src={src} alt={`Предпросмотр ${index + 1}`} />
                            <button
                                className="delete-image-btn"
                                onClick={() => handleDeleteImage(index)}
                            >
                                ×
                            </button>
                            {index === 3 && remainingCount > 0 && (
                                <div className="more-images-overlay-grid">+{remainingCount}</div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default PointCreationForm;