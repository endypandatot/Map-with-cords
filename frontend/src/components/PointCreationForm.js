import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LIMITS, LIMIT_MESSAGES, checkLimits } from '../constants/limits';
import CancelIcon from './SvgIcons/CancelIcon';
import SaveIcon from './SvgIcons/SaveIcon';
import { processImages } from '../utils/imageHelpers';

function PointCreationForm({ point, tempCoords, onSave, onCancel }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [lat, setLat] = useState('');
    const [lon, setLon] = useState('');
    const [images, setImages] = useState([]);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (point) {
            setName(point.name || '');
            setDescription(point.description || '');
            setLat(point.lat ? String(point.lat) : '');
            setLon(point.lon ? String(point.lon) : '');

            // Используем централизованную обработку изображений
            const processedImages = processImages(point.images || []);
            setImages(processedImages);
        } else if (tempCoords) {
            setLat(tempCoords[0].toFixed(6));
            setLon(tempCoords[1].toFixed(6));
        }
    }, [point, tempCoords]);

    const handleImageUpload = useCallback(async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const currentCount = images.length;
        const availableSlots = LIMITS.MAX_IMAGES_PER_POINT - currentCount;

        if (availableSlots <= 0) {
            alert(LIMIT_MESSAGES.MAX_IMAGES);
            e.target.value = '';
            return;
        }

        const filesToProcess = files.slice(0, availableSlots);
        const newImages = [];
        const errors = [];

        for (const file of filesToProcess) {
            // Проверка формата
            if (!checkLimits.isImageFormatValid(file.name)) {
                errors.push(`${file.name}: ${LIMIT_MESSAGES.INVALID_IMAGE_FORMAT}`);
                continue;
            }

            // Проверка размера
            if (!checkLimits.isImageSizeValid(file.size)) {
                errors.push(`${file.name}: ${LIMIT_MESSAGES.MAX_IMAGE_SIZE}`);
                continue;
            }

            try {
                const reader = new FileReader();
                const base64Promise = new Promise((resolve, reject) => {
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                });
                reader.readAsDataURL(file);
                const base64 = await base64Promise;
                newImages.push(base64);
            } catch (error) {
                errors.push(`${file.name}: ошибка загрузки файла`);
            }
        }

        if (errors.length > 0) {
            alert(`Ошибки при загрузке изображений:\n${errors.join('\n')}`);
        }

        if (newImages.length > 0) {
            setImages(prevImages => [...prevImages, ...newImages]);
        }

        e.target.value = '';
    }, [images.length]);

    const handleDeleteImage = useCallback((indexToDelete) => {
        setImages(prevImages => prevImages.filter((_, idx) => idx !== indexToDelete));
    }, []);

    const handleSaveClick = useCallback(() => {
        if (!checkLimits.isTextLengthValid(name, LIMITS.MAX_POINT_NAME_LENGTH)) {
            alert(LIMIT_MESSAGES.MAX_POINT_NAME);
            return;
        }

        if (!checkLimits.isTextLengthValid(description, LIMITS.MAX_POINT_DESCRIPTION_LENGTH)) {
            alert(LIMIT_MESSAGES.MAX_POINT_DESCRIPTION);
            return;
        }

        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);

        if (isNaN(latNum) || isNaN(lonNum)) {
            alert('Пожалуйста, введите корректные координаты.');
            return;
        }

        const pointData = {
            ...(point?.id && { id: point.id }),
            name,
            description,
            lat: latNum,
            lon: lonNum,
            images
        };

        onSave(pointData, point?.index);
    }, [name, description, lat, lon, images, point, onSave]);

    return (
        <div className="form-container">
            {/* HEADER - ЗАГОЛОВОК СЛЕВА, КНОПКИ ВМЕСТЕ СПРАВА */}
            <div className="routes-header">
                <div className="routes-title">
                    {point?.id && typeof point.id === 'number' ? 'Редактирование точки' : 'Создание точки'}
                </div>
                <div className="route-form-actions">
                    <SaveIcon onClick={handleSaveClick} />
                    <CancelIcon onClick={onCancel} />
                </div>
            </div>

            {/* INPUT НАЗВАНИЕ */}
            <input
                type="text"
                placeholder="Название точки"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={LIMITS.MAX_POINT_NAME_LENGTH}
            />

            {/* TEXTAREA ОПИСАНИЕ */}
            <textarea
                placeholder="Описание точки"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={LIMITS.MAX_POINT_DESCRIPTION_LENGTH}
            />

            {/* КООРДИНАТЫ */}
            <div className="form-coords-inputs">
                <div>
                    <label>Широта</label>
                    <input
                        type="text"
                        placeholder="00.000000"
                        value={lat}
                        onChange={(e) => setLat(e.target.value)}
                        readOnly={!!tempCoords}
                    />
                </div>
                <div>
                    <label>Долгота</label>
                    <input
                        type="text"
                        placeholder="00.000000"
                        value={lon}
                        onChange={(e) => setLon(e.target.value)}
                        readOnly={!!tempCoords}
                    />
                </div>
            </div>

            {/* GRID С ИЗОБРАЖЕНИЯМИ */}
            {images.length > 0 && (
                <div className={`point-images-grid-preview count-${Math.min(images.length, 4)}`}>
                    {images.map((img, idx) => (
                        <div key={idx} className="point-image-grid-item">
                            <img src={img} alt="" />
                            <button
                                className="delete-image-btn"
                                onClick={() => handleDeleteImage(idx)}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* КНОПКА ЗАГРУЗКИ С ПРЕДУПРЕЖДЕНИЕМ */}
            {images.length < LIMITS.MAX_IMAGES_PER_POINT && (
                <>
                    <button
                        className="form-upload-btn"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        Загрузить изображения ({images.length}/{LIMITS.MAX_IMAGES_PER_POINT})
                    </button>
                    <div style={{
                        fontSize: '10px',
                        color: 'rgba(48, 55, 45, 0.60)',
                        marginTop: '-8px',
                        textAlign: 'center'
                    }}>
                        Форматы: JPG, PNG, GIF, WEBP, BMP. Макс. размер: {LIMITS.MAX_IMAGE_SIZE_MB} МБ
                    </div>
                </>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp"
                multiple
                style={{ display: 'none' }}
                onChange={handleImageUpload}
            />
        </div>
    );
}

export default PointCreationForm;
