// src/components/YandexMap.js
import React, { useEffect, useRef, useState } from 'react';
import { UI_MODE } from '../App';

console.log('🗺️ YandexMap.js loaded!');

const decimalToDMS = (dec) => {
    if (isNaN(dec) || dec === '' || dec === null) return '';
    const absolute = Math.abs(dec);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = Math.floor((minutesNotTruncated - minutes) * 60);
    return `${degrees}°${minutes}'${seconds}"`;
};

// Создаем безопасный кастомный layout с максимальной защитой от ошибок
const createSafePlacemarkHintLayout = (ymaps) => {
    try {
        return ymaps.templateLayoutFactory.createClass(
            // Простой HTML без циклов и сложной логики
            '<div class="figma-hint">' +
                '<div class="figma-hint-main">' +
                    '<div class="figma-hint-title">{{ properties.safeData.name }}</div>' +
                    '<div class="figma-hint-description">{{ properties.safeData.description }}</div>' +
                    '<div class="figma-hint-coordinates">' +
                        '<div class="figma-coord-item">' +
                            '<span class="figma-coord-label">Широта</span>' +
                            '<span class="figma-coord-value">{{ properties.safeData.lat }}</span>' +
                        '</div>' +
                        '<div class="figma-coord-item">' +
                            '<span class="figma-coord-label">Долгота</span>' +
                            '<span class="figma-coord-value">{{ properties.safeData.lon }}</span>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '{{ properties.safeData.imagesHtml|raw }}' +
            '</div>',
            {
                build: function () {
                    try {
                        // Вызываем родительский метод безопасно
                        if (this.constructor.superclass && this.constructor.superclass.build) {
                            this.constructor.superclass.build.call(this);
                        }

                        // Добавляем стили только один раз
                        this.injectStyles();

                        // Логируем для отладки
                        const data = this.getData();
                        console.log('🎨 Building safe Figma hint:', {
                            name: data.safeData?.name,
                            hasImages: !!data.safeData?.imagesHtml
                        });

                    } catch (error) {
                        console.error('🎨 Error in hint build:', error);
                    }
                },

                clear: function () {
                    try {
                        if (this.constructor.superclass && this.constructor.superclass.clear) {
                            this.constructor.superclass.clear.call(this);
                        }
                    } catch (error) {
                        console.error('🎨 Error in hint clear:', error);
                    }
                },

                injectStyles: function() {
                    if (document.getElementById('figma-hint-styles')) return;

                    try {
                        const style = document.createElement('style');
                        style.id = 'figma-hint-styles';
                        style.textContent = `
                            .figma-hint {
                                background: #fdf5f5;
                                border: 1px solid rgba(54, 55, 45, 0.16);
                                border-radius: 8px;
                                padding: 8px;
                                display: flex;
                                gap: 8px;
                                min-width: 230px;
                                max-width: 350px;
                                font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
                                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                                position: relative;
                            }

                            .figma-hint-main {
                                flex: 1;
                                display: flex;
                                flex-direction: column;
                                gap: 8px;
                                min-width: 0;
                                max-width: calc(100% - 48px);
                            }

                            .figma-hint-title {
                                color: #36372d;
                                font-size: 12px;
                                font-weight: 400;
                                line-height: 1.3;
                                margin: 0;
                                word-wrap: break-word;
                                overflow-wrap: break-word;
                            }

                            .figma-hint-description {
                                color: #36372d;
                                font-size: 8px;
                                font-weight: 400;
                                line-height: 1.4;
                                margin: 0;
                                display: -webkit-box;
                                -webkit-line-clamp: 2;
                                -webkit-box-orient: vertical;
                                overflow: hidden;
                                text-overflow: ellipsis;
                                word-wrap: break-word;
                                overflow-wrap: break-word;
                            }

                            .figma-hint-coordinates {
                                display: flex;
                                gap: 16px;
                                margin-top: 4px;
                                flex-wrap: wrap;
                            }

                            .figma-coord-item {
                                display: flex;
                                flex-direction: column;
                                gap: 2px;
                                min-width: 0;
                                flex-shrink: 1;
                            }

                            .figma-coord-label {
                                color: #36372d;
                                font-size: 8px;
                                font-weight: 400;
                                opacity: 0.7;
                                white-space: nowrap;
                            }

                            .figma-coord-value {
                                color: #36372d;
                                font-size: 8px;
                                font-weight: 400;
                                white-space: nowrap;
                                overflow: hidden;
                                text-overflow: ellipsis;
                            }

                            .figma-hint-images {
                                display: flex;
                                flex-direction: column;
                                gap: 4px;
                                width: 32px;
                                flex-shrink: 0;
                                align-self: flex-start;
                            }

                            .figma-hint-image {
                                width: 32px;
                                height: 32px;
                                border-radius: 4px;
                                object-fit: cover;
                                border: 1px solid rgba(54, 55, 45, 0.1);
                                display: block;
                            }

                            .figma-hint-image-overlay {
                                position: relative;
                                width: 32px;
                                height: 32px;
                            }

                            .figma-hint-image-overlay::after {
                                content: '';
                                position: absolute;
                                top: 0;
                                left: 0;
                                right: 0;
                                bottom: 0;
                                background: rgba(0, 0, 0, 0.5);
                                border-radius: 4px;
                                pointer-events: none;
                            }

                            .figma-hint-image-count {
                                position: absolute;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -50%);
                                color: white;
                                font-size: 10px;
                                font-weight: 700;
                                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
                                z-index: 1;
                                pointer-events: none;
                            }
                        `;
                        document.head.appendChild(style);
                    } catch (error) {
                        console.error('🎨 Error injecting styles:', error);
                    }
                }
            }
        );
    } catch (error) {
        console.error('🎨 Error creating hint layout:', error);
        return null;
    }
};

// Безопасная функция для создания HTML изображений
const createSafeImageHTML = (images) => {
    try {
        if (!Array.isArray(images) || images.length === 0) {
            return '';
        }

        const validImages = images.filter(img =>
            typeof img === 'string' && img.trim() !== ''
        );

        if (validImages.length === 0) {
            return '';
        }

        let imagesHTML = '<div class="figma-hint-images">';

        // Показываем максимум 3 изображения
        const imagesToShow = validImages.slice(0, 3);
        const remainingCount = Math.max(0, validImages.length - 3);

        imagesToShow.forEach((imageUrl, index) => {
            const isLast = index === imagesToShow.length - 1;
            const hasOverlay = isLast && remainingCount > 0;

            if (hasOverlay) {
                imagesHTML += `
                    <div class="figma-hint-image-overlay">
                        <img class="figma-hint-image" src="${imageUrl}" alt="">
                        <div class="figma-hint-image-count">+${remainingCount}</div>
                    </div>
                `;
            } else {
                imagesHTML += `<img class="figma-hint-image" src="${imageUrl}" alt="">`;
            }
        });

        imagesHTML += '</div>';
        return imagesHTML;

    } catch (error) {
        console.error('🎨 Error creating image HTML:', error);
        return '';
    }
};

function YandexMap({ currentRoute, tempPointCoords, uiMode, onMapClick, pointToEdit, onEditPoint, waitingForCoordinates }) {
    console.log('🗺️ YandexMap component RENDERING!', {
        uiMode,
        currentRouteId: currentRoute?.id,
        currentRouteName: currentRoute?.name,
        pointsCount: currentRoute?.points?.length || 0
    });

    const mapContainerRef = useRef(null);
    const mapInstance = useRef(null);
    const [mapReady, setMapReady] = useState(false);
    const ymaps = window.ymaps;

    // Логируем каждую точку при рендере
    if (currentRoute?.points) {
        console.log('🗺️ Route points in YandexMap:');
        currentRoute.points.forEach((point, index) => {
            console.log(`  Point ${index}:`, {
                id: point.id,
                name: point.name,
                lat: point.lat,
                lon: point.lon,
                imagesCount: point.images?.length || 0,
                images: point.images,
                isLatValid: !isNaN(parseFloat(point.lat)),
                isLonValid: !isNaN(parseFloat(point.lon))
            });
        });
    }

    // useEffect[1] - Инициализация карты
    useEffect(() => {
        console.log('🗺️ YandexMap useEffect[1] - Map initialization');
        if (!mapContainerRef.current || !ymaps) {
            console.log('🗺️ Missing container or ymaps:', {
                container: !!mapContainerRef.current,
                ymaps: !!ymaps
            });
            return;
        }

        ymaps.ready(() => {
            console.log('🗺️ ymaps.ready() callback executed');
            if (!mapInstance.current && mapContainerRef.current) {
                console.log('🗺️ Creating new map instance');
                const map = new ymaps.Map(mapContainerRef.current, {
                    center: [55.75, 37.57],
                    zoom: 10,
                    controls: ['zoomControl', 'fullscreenControl']
                }, {
                    suppressMapOpenBlock: true
                });

                // ===== ДОБАВЛЕНИЕ ЛИНЕЙКИ =====
                // Пытаемся добавить rulerControl для измерения расстояний
                try {
                    map.controls.add('rulerControl');
                    console.log('📏 Ruler control added successfully');
                } catch (e) {
                    console.warn('📏 Failed to add ruler control:', e);
                }
                // ===== КОНЕЦ ДОБАВЛЕНИЯ ЛИНЕЙКИ =====

                map.events.add('click', (e) => {
                    console.log('🗺️ Map clicked at:', e.get('coords'));
                    onMapClick(e.get('coords'));
                });

                mapInstance.current = map;
                setMapReady(true);
                console.log('🗺️ Map instance created successfully');
            }
        });

        return () => {
            console.log('🗺️ YandexMap cleanup');
            if (mapInstance.current) {
                mapInstance.current.destroy();
                mapInstance.current = null;
            }
            setMapReady(false);

            // Убираем стили при размонтировании
            const styleElement = document.getElementById('figma-hint-styles');
            if (styleElement) {
                styleElement.remove();
            }
        };
    }, [ymaps, onMapClick]);

    // useEffect[2] - Обновление карты при изменении данных
    useEffect(() => {
        console.log('🗺️ YandexMap useEffect[2] - Map update');

        const map = mapInstance.current;
        if (!map || !ymaps || !mapReady) {
            console.log('🗺️ Skipping update:', {
                hasMap: !!map,
                hasYmaps: !!ymaps,
                mapReady
            });
            return;
        }

        console.log('🗺️ Clearing existing objects');
        map.geoObjects.removeAll();

        // Создаем безопасный кастомный layout
        let SafeHintLayout = null;
        try {
            SafeHintLayout = createSafePlacemarkHintLayout(ymaps);
            if (SafeHintLayout) {
                console.log('🎨 Safe Figma HintLayout created successfully');
            } else {
                console.log('🎨 Failed to create HintLayout, will use standard hints');
            }
        } catch (error) {
            console.error('🎨 Error creating SafeHintLayout:', error);
            SafeHintLayout = null;
        }

        // Проверяем режим просмотра маршрута
        if (uiMode === UI_MODE.VIEW_ROUTE_DETAILS && currentRoute && currentRoute.points && currentRoute.points.length > 0) {
            console.log('🗺️ VIEW_ROUTE_DETAILS mode detected');

            const validPoints = [];
            currentRoute.points.forEach((point, index) => {
                const lat = parseFloat(point.lat);
                const lon = parseFloat(point.lon);

                if (!isNaN(lat) && !isNaN(lon)) {
                    validPoints.push({ ...point, latParsed: lat, lonParsed: lon });
                }
            });

            console.log(`🗺️ Valid points count: ${validPoints.length}`);

            if (validPoints.length > 0) {
                console.log('🗺️ Creating placemarks for viewing');

                validPoints.forEach((point, index) => {
                    const coords = [point.latParsed, point.lonParsed];
                    console.log(`🗺️ Creating placemark ${index} at:`, coords);

                    try {
                        // Безопасная обработка изображений
                        let processedImages = [];
                        if (Array.isArray(point.images)) {
                            processedImages = point.images.filter(img =>
                                typeof img === 'string' && img.trim() !== ''
                            );
                        }

                        console.log(`🗺️ Processed images for placemark ${index}:`, processedImages);

                        // Подготавливаем безопасные данные для шаблона
                        const safeData = {
                            name: (point.name || 'Без названия').toString().replace(/[<>&"]/g, ''),
                            description: (point.description || 'Без описания').toString().replace(/[<>&"]/g, ''),
                            lat: decimalToDMS(point.latParsed),
                            lon: decimalToDMS(point.lonParsed),
                            imagesHtml: createSafeImageHTML(processedImages)
                        };

                        console.log(`🎨 Safe data for placemark ${index}:`, {
                            name: safeData.name,
                            hasImagesHtml: !!safeData.imagesHtml
                        });

                        // Fallback данные для стандартной подсказки
                        const imageText = processedImages.length > 0 ? ` | 📷 ${processedImages.length} фото` : '';
                        const fallbackHintText = `${point.name || 'Без названия'}\n${point.description || 'Без описания'}\n📍 ${safeData.lat}, ${safeData.lon}${imageText}`;

                        // Настройки метки
                        const placemarkProperties = {
                            safeData: safeData,
                            hintContent: fallbackHintText, // Fallback для стандартной подсказки
                            balloonContent: `
                                <div style="max-width: 300px;">
                                    <h3 style="margin: 0 0 8px 0; color: #36372d; font-size: 16px;">${point.name || 'Без названия'}</h3>
                                    <p style="margin: 0 0 8px 0; color: #666; font-size: 14px; line-height: 1.4;">${point.description || 'Без описания'}</p>
                                    <div style="display: flex; gap: 16px; margin-bottom: 8px; font-size: 12px; color: #888;">
                                        <div>
                                            <div style="font-weight: 500;">Широта</div>
                                            <div>${safeData.lat}</div>
                                        </div>
                                        <div>
                                            <div style="font-weight: 500;">Долгота</div>
                                            <div>${safeData.lon}</div>
                                        </div>
                                    </div>
                                    ${processedImages.length > 0 ? `
                                        <div style="margin-top: 12px;">
                                            <div style="margin-bottom: 8px; font-weight: 500; color: #36372d;">Фотографии (${processedImages.length}):</div>
                                            <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                                                ${processedImages.slice(0, 6).map((image, imgIndex) => `
                                                    <div style="position: relative; width: 60px; height: 60px;">
                                                        <img src="${image}"
                                                             style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd;"
                                                             alt="Фото ${imgIndex + 1}"
                                                             onclick="window.open('${image}', '_blank')">
                                                        ${imgIndex === 5 && processedImages.length > 6 ?
                                                            `<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; cursor: pointer;">+${processedImages.length - 6}</div>` : ''
                                                        }
                                                    </div>
                                                `).join('')}
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                            `
                        };

                        const placemarkOptions = {
                            preset: 'islands#blueDotIcon',
                            iconContent: String(index + 1),
                            hideIconOnBalloonOpen: false,
                            balloonMaxWidth: 350,
                            balloonPanelMaxMapArea: 0,
                            balloonOffset: [0, -40]
                        };

                        // Добавляем кастомный layout только если он создан успешно
                        if (SafeHintLayout) {
                            try {
                                placemarkOptions.hintLayout = SafeHintLayout;
                                placemarkOptions.hintOffset = [15, 15];
                                placemarkOptions.hintPane = 'outerHint';
                                console.log(`🎨 Using Figma hint for placemark ${index}`);
                            } catch (error) {
                                console.error(`🎨 Error setting custom hint for placemark ${index}:`, error);
                            }
                        } else {
                            console.log(`🎨 Using standard hint for placemark ${index}`);
                        }

                        const placemark = new ymaps.Placemark(coords, placemarkProperties, placemarkOptions);

                        map.geoObjects.add(placemark);
                        console.log(`🗺️ Successfully added placemark ${index} with ${processedImages.length} images`);
                    } catch (error) {
                        console.error(`🗺️ Error creating placemark ${index}:`, error);
                    }
                });

                // Создаем линию маршрута
                if (validPoints.length > 1) {
                    try {
                        const coordinates = validPoints.map(p => [p.latParsed, p.lonParsed]);
                        const polyline = new ymaps.Polyline(coordinates, {}, {
                            strokeColor: "#0000FF",
                            strokeWidth: 4,
                            strokeOpacity: 0.8
                        });
                        map.geoObjects.add(polyline);
                        console.log('🗺️ Successfully added polyline');
                    } catch (error) {
                        console.error('🗺️ Error creating polyline:', error);
                    }
                }

                // Центрируем карту
                try {
                    const bounds = validPoints.map(p => [p.latParsed, p.lonParsed]);
                    if (bounds.length > 0) {
                        map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 40 });
                        console.log('🗺️ Successfully set map bounds');
                    }
                } catch (error) {
                    console.error('🗺️ Error setting bounds:', error);
                    if (validPoints.length > 0) {
                        map.setCenter([validPoints[0].latParsed, validPoints[0].lonParsed], 12);
                    }
                }
            }
        }

        // Режим создания/редактирования маршрута
        else if ((uiMode === UI_MODE.CREATE_ROUTE || uiMode === UI_MODE.EDIT_ROUTE) && currentRoute && currentRoute.points && currentRoute.points.length > 0) {
            console.log('🗺️ CREATE/EDIT ROUTE mode detected');

            const validPoints = [];
            currentRoute.points.forEach((point, index) => {
                const lat = parseFloat(point.lat);
                const lon = parseFloat(point.lon);

                if (!isNaN(lat) && !isNaN(lon)) {
                    validPoints.push({ ...point, latParsed: lat, lonParsed: lon });
                }
            });

            if (validPoints.length > 0) {
                validPoints.forEach((point, index) => {
                    const coords = [point.latParsed, point.lonParsed];

                    try {
                        // Безопасная обработка изображений
                        let processedImages = [];
                        if (Array.isArray(point.images)) {
                            processedImages = point.images.filter(img =>
                                typeof img === 'string' && img.trim() !== ''
                            );
                        }

                        // Подготавливаем безопасные данные для шаблона
                        const safeData = {
                            name: (point.name || 'Без названия').toString().replace(/[<>&"]/g, ''),
                            description: (point.description || 'Без описания').toString().replace(/[<>&"]/g, ''),
                            lat: decimalToDMS(point.latParsed),
                            lon: decimalToDMS(point.lonParsed),
                            imagesHtml: createSafeImageHTML(processedImages)
                        };

                        // Fallback данные для стандартной подсказки
                        const imageText = processedImages.length > 0 ? ` | 📷 ${processedImages.length} фото` : '';
                        const fallbackHintText = `${point.name || 'Без названия'}\n${point.description || 'Без описания'}\n📍 ${safeData.lat}, ${safeData.lon}${imageText}`;

                        const placemarkOptions = {
                            preset: 'islands#greenDotIcon',
                            iconContent: String(index + 1),
                            hideIconOnBalloonOpen: false,
                            balloonMaxWidth: 350
                        };

                        // Добавляем кастомный layout только если он создан успешно
                        if (SafeHintLayout) {
                            try {
                                placemarkOptions.hintLayout = SafeHintLayout;
                                placemarkOptions.hintOffset = [15, 15];
                                placemarkOptions.hintPane = 'outerHint';
                            } catch (error) {
                                console.error(`🎨 Error setting custom hint for GREEN placemark ${index}:`, error);
                            }
                        }

                        const placemark = new ymaps.Placemark(coords, {
                            safeData: safeData,
                            hintContent: fallbackHintText,
                            balloonContent: `
                                <div style="max-width: 300px;">
                                    <h3 style="margin: 0 0 8px 0; color: #36372d;">${point.name || 'Без названия'}</h3>
                                    <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${point.description || 'Без описания'}</p>
                                    <small style="color: #888;">📍 ${safeData.lat}, ${safeData.lon}</small>
                                    ${processedImages.length > 0 ? `<br><small style="color: #888;">📷 ${processedImages.length} фотографий</small>` : ''}
                                </div>
                            `
                        }, placemarkOptions);

                        // Добавляем обработчик клика для редактирования
                        placemark.events.add('click', (e) => {
                            e.stopPropagation();
                            onEditPoint(point, index);
                        });

                        map.geoObjects.add(placemark);
                        console.log(`🗺️ Successfully added GREEN placemark ${index}`);
                    } catch (error) {
                        console.error(`🗺️ Error creating GREEN placemark ${index}:`, error);
                    }
                });

                // Создаем зеленую линию маршрута
                if (validPoints.length > 1) {
                    try {
                        const coordinates = validPoints.map(p => [p.latParsed, p.lonParsed]);
                        const polyline = new ymaps.Polyline(coordinates, {}, {
                            strokeColor: "#536C45",
                            strokeWidth: 4,
                            strokeOpacity: 0.8
                        });
                        map.geoObjects.add(polyline);
                        console.log('🗺️ Successfully added GREEN polyline');
                    } catch (error) {
                        console.error('🗺️ Error creating GREEN polyline:', error);
                    }
                }

                // Центрируем карту
                try {
                    const bounds = validPoints.map(p => [p.latParsed, p.lonParsed]);
                    map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 40 });
                    console.log('🗺️ Successfully set bounds for editing');
                } catch (error) {
                    console.error('🗺️ Error setting bounds for editing:', error);
                }
            }
        }

        // Режим добавления временной точки
        else if (tempPointCoords && (uiMode === UI_MODE.CREATE_ROUTE || uiMode === UI_MODE.EDIT_ROUTE)) {
            console.log('🗺️ Adding temporary point at:', tempPointCoords);
            try {
                const tempPlacemark = new ymaps.Placemark(tempPointCoords, {
                    hintContent: 'Новая точка',
                    balloonContent: 'Заполните информацию о точке'
                }, {
                    preset: 'islands#redDotIcon',
                    draggable: true
                });

                tempPlacemark.events.add('dragend', (e) => {
                    const newCoords = e.get('target').geometry.getCoordinates();
                    console.log('🗺️ Temp placemark moved to:', newCoords);
                });

                map.geoObjects.add(tempPlacemark);
                console.log('🗺️ Successfully added temporary placemark');
            } catch (error) {
                console.error('🗺️ Error creating temporary placemark:', error);
            }
        }

    }, [ymaps, uiMode, currentRoute, tempPointCoords, pointToEdit, onEditPoint, waitingForCoordinates, mapReady]);

    return <div id="yandex-map" ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />;
}

export default YandexMap;
