
import React, { useEffect, useRef, useState } from 'react';
import { UI_MODE } from '../constants/uiModes';
import { decimalToDMS } from '../utils/formatters';
import { processImages } from '../utils/imageHelpers';

const createSafePlacemarkHintLayout = (ymaps) => {
    try {
        return ymaps.templateLayoutFactory.createClass(
            '<div class="figma-hint">' +
                '<div class="figma-hint-main">' +
                    '<div class="figma-hint-title">$[properties.safeData.name]</div>' +
                    '<div class="figma-hint-description">$[properties.safeData.description]</div>' +
                    '<div class="figma-hint-coordinates">' +
                        '<div class="figma-coord-item">' +
                            '<span class="figma-coord-label">Широта</span>' +
                            '<span class="figma-coord-value">$[properties.safeData.lat]</span>' +
                        '</div>' +
                        '<div class="figma-coord-item">' +
                            '<span class="figma-coord-label">Долгота</span>' +
                            '<span class="figma-coord-value">$[properties.safeData.lon]</span>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div id="hint-images-container"></div>' +
            '</div>',
            {
                build: function () {
                    try {
                        if (this.constructor.superclass && this.constructor.superclass.build) {
                            this.constructor.superclass.build.call(this);
                        }
                        this.injectStyles();

                        const data = this.getData();
                        const imagesContainer = this.getElement().querySelector('#hint-images-container');

                        if (imagesContainer && data.safeData && data.safeData.images) {
                            this.renderImages(imagesContainer, data.safeData.images);
                        }
                    } catch (error) {
                        console.error('Error in hint build:', error);
                    }
                },

                clear: function () {
                    try {
                        if (this.constructor.superclass && this.constructor.superclass.clear) {
                            this.constructor.superclass.clear.call(this);
                        }
                    } catch (error) {
                        console.error('Error in hint clear:', error);
                    }
                },

                renderImages: function(container, images) {
                    if (!Array.isArray(images) || images.length === 0) return;

                    const validImages = images.filter(img => img && typeof img === 'string' && img.trim() !== '');
                    if (validImages.length === 0) return;

                    const imagesDiv = document.createElement('div');
                    imagesDiv.className = 'figma-hint-images';

                    const imagesToShow = validImages.slice(0, 3);
                    const remainingCount = Math.max(0, validImages.length - 3);

                    imagesToShow.forEach((imageUrl, index) => {
                        const isLast = index === imagesToShow.length - 1;
                        const hasOverlay = isLast && remainingCount > 0;

                        if (hasOverlay) {
                            const overlayDiv = document.createElement('div');
                            overlayDiv.className = 'figma-hint-image-overlay';

                            const img = document.createElement('img');
                            img.className = 'figma-hint-image';
                            img.src = imageUrl;
                            img.alt = '';
                            img.loading = 'lazy';
                            img.onerror = function() {
                                console.error('Failed to load image:', imageUrl);
                                this.style.display = 'none';
                            };

                            const countDiv = document.createElement('div');
                            countDiv.className = 'figma-hint-image-count';
                            countDiv.textContent = `+${remainingCount}`;

                            overlayDiv.appendChild(img);
                            overlayDiv.appendChild(countDiv);
                            imagesDiv.appendChild(overlayDiv);
                        } else {
                            const img = document.createElement('img');
                            img.className = 'figma-hint-image';
                            img.src = imageUrl;
                            img.alt = '';
                            img.loading = 'lazy';
                            img.onerror = function() {
                                console.error('Failed to load image:', imageUrl);
                                this.style.display = 'none';
                            };
                            imagesDiv.appendChild(img);
                        }
                    });

                    container.appendChild(imagesDiv);
                },

                injectStyles: function() {
                    if (document.getElementById('figma-hint-styles')) return;

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
                            word-wrap: break-word;
                        }
                        .figma-hint-description {
                            color: #36372d;
                            font-size: 8px;
                            line-height: 1.4;
                            overflow: hidden;
                            text-overflow: ellipsis;
                        }
                        .figma-hint-coordinates {
                            display: flex;
                            gap: 16px;
                            margin-top: 4px;
                        }
                        .figma-coord-item {
                            display: flex;
                            flex-direction: column;
                            gap: 2px;
                        }
                        .figma-coord-label {
                            color: #36372d;
                            font-size: 8px;
                            opacity: 0.7;
                        }
                        .figma-coord-value {
                            color: #36372d;
                            font-size: 8px;
                        }
                        .figma-hint-images {
                            display: flex;
                            flex-direction: column;
                            gap: 4px;
                            width: 32px;
                            flex-shrink: 0;
                        }
                        .figma-hint-image {
                            width: 32px;
                            height: 32px;
                            border-radius: 4px;
                            object-fit: cover;
                            border: 1px solid rgba(54, 55, 45, 0.1);
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
                        }
                        .figma-hint-image-count {
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            color: white;
                            font-size: 10px;
                            font-weight: 700;
                            z-index: 1;
                        }
                    `;
                    document.head.appendChild(style);
                }
            }
        );
    } catch (error) {
        console.error('Error creating hint layout:', error);
        return null;
    }
};

const safeSetBounds = (map, points) => {
    try {
        console.log('🔍 safeSetBounds called with points:', points);

        if (!points || points.length === 0) {
            console.warn('⚠️ No points to set bounds');
            return;
        }

        // Извлекаем координаты
        const coords = [];
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            const lat = point.latParsed;
            const lon = point.lonParsed;

            if (typeof lat === 'number' && typeof lon === 'number' && !isNaN(lat) && !isNaN(lon) && isFinite(lat) && isFinite(lon)) {
                coords.push([lat, lon]);
                console.log(`   ✅ Valid coordinates: [${lat}, ${lon}]`);
            } else {
                console.warn(`   ⚠️ Invalid coordinates for point ${i}:`, { lat, lon });
            }
        }

        if (coords.length === 0) {
            console.warn('⚠️ No valid coordinates for setBounds');
            return;
        }

        // ИСПРАВЛЕНО: если только одна точка, центрируем карту вместо setBounds
        if (coords.length === 1) {
            console.log('📍 Only one point, centering map instead of setBounds');
            console.log('   Centering on:', coords[0]);
            map.setCenter(coords[0], 14);
            console.log('✅ Map centered successfully');
            return;
        }

        console.log('🗺️ Multiple points, using setBounds');
        console.log('   Coordinates array:', coords);

        // Проверка структуры координат
        for (let i = 0; i < coords.length; i++) {
            const coord = coords[i];
            if (!Array.isArray(coord) || coord.length !== 2) {
                console.error(`❌ Invalid coordinate structure at index ${i}:`, coord);
                return;
            }
            if (typeof coord[0] !== 'number' || typeof coord[1] !== 'number') {
                console.error(`❌ Invalid coordinate types at index ${i}:`, coord);
                return;
            }
            if (isNaN(coord[0]) || isNaN(coord[1]) || !isFinite(coord[0]) || !isFinite(coord[1])) {
                console.error(`❌ Invalid coordinate values at index ${i}:`, coord);
                return;
            }
        }

        console.log('✅ All coordinates valid, calling map.setBounds()');

        try {
            map.setBounds(coords, { checkZoomRange: true, zoomMargin: 40 });
            console.log('✅ setBounds completed successfully');
        } catch (boundsError) {
            console.error('❌ Error calling map.setBounds():', boundsError);
            console.error('Coordinates that caused error:', coords);
            // Fallback: центрируем карту на первой точке
            if (coords.length > 0) {
                console.log('🔄 Fallback: centering on first point');
                map.setCenter(coords[0], 10);
            }
        }
    } catch (error) {
        console.error('❌ Error in safeSetBounds:', error);
        console.error('Error stack:', error.stack);
    }
};

function YandexMap({ currentRoute, previewRoute, tempPointCoords, uiMode, onMapClick, pointToEdit, onEditPoint, waitingForCoordinates }) {
    const mapContainerRef = useRef(null);
    const mapInstance = useRef(null);
    const [mapReady, setMapReady] = useState(false);
    const [apiLoaded, setApiLoaded] = useState(false);

    // Проверяем загрузку Yandex Maps API
    useEffect(() => {
        const checkYmapsLoaded = () => {
            if (window.ymaps) {
                setApiLoaded(true);
            } else {
                setTimeout(checkYmapsLoaded, 100);
            }
        };

        checkYmapsLoaded();
    }, []);

    useEffect(() => {
        if (!mapContainerRef.current || !apiLoaded || !window.ymaps) return;

        const ymaps = window.ymaps;

        ymaps.ready(() => {
            if (!mapInstance.current && mapContainerRef.current) {
                try {
                    const map = new ymaps.Map(mapContainerRef.current, {
                        center: [55.75, 37.57],
                        zoom: 10,
                        controls: ['zoomControl', 'fullscreenControl']
                    }, {
                        suppressMapOpenBlock: true
                    });

                    try {
                        map.controls.add('rulerControl');
                    } catch (e) {
                        console.warn('Failed to add ruler control:', e);
                    }

                    map.events.add('click', (e) => {
                        const coords = e.get('coords');
                        const roundedCoords = [
                            Math.round(coords[0] * 1000000) / 1000000,
                            Math.round(coords[1] * 1000000) / 1000000
                        ];
                        onMapClick(roundedCoords);
                    });

                    mapInstance.current = map;
                    setMapReady(true);
                } catch (error) {
                    console.error('Error creating map:', error);
                }
            }
        });

        return () => {
            if (mapInstance.current) {
                try {
                    mapInstance.current.destroy();
                } catch (error) {
                    console.error('Error destroying map:', error);
                }
                mapInstance.current = null;
            }
            setMapReady(false);
            const styleElement = document.getElementById('figma-hint-styles');
            if (styleElement) styleElement.remove();
        };
    }, [apiLoaded, onMapClick]);

    useEffect(() => {
        const map = mapInstance.current;
        if (!map || !window.ymaps || !mapReady) return;

        const ymaps = window.ymaps;

        try {
            map.geoObjects.removeAll();

            let SafeHintLayout = null;
            try {
                SafeHintLayout = createSafePlacemarkHintLayout(ymaps);
            } catch (error) {
                console.error('Error creating SafeHintLayout:', error);
            }

            const createSafePlacemarkData = (point) => {
                let processedImages = [];
                if (Array.isArray(point.images)) {
                    processedImages = processImages(point.images);
                }

                return {
                    name: (point.name || 'Без названия').toString().replace(/[<>&"']/g, ''),
                    description: (point.description || 'Без описания').toString().replace(/[<>&"']/g, ''),
                    lat: decimalToDMS(point.latParsed || parseFloat(point.lat)),
                    lon: decimalToDMS(point.lonParsed || parseFloat(point.lon)),
                    images: processedImages
                };
            };

            // PREVIEW MODE
            if (uiMode === UI_MODE.MAIN_LIST && previewRoute && previewRoute.points && previewRoute.points.length > 0) {
                const validPoints = previewRoute.points
                    .map(point => {
                        const lat = parseFloat(point.lat);
                        const lon = parseFloat(point.lon);
                        return !isNaN(lat) && !isNaN(lon) ? { ...point, latParsed: lat, lonParsed: lon } : null;
                    })
                    .filter(Boolean);

                if (validPoints.length > 0) {
                    validPoints.forEach((point, index) => {
                        const coords = [point.latParsed, point.lonParsed];
                        const safeData = createSafePlacemarkData(point);

                        const placemarkOptions = {
                            preset: 'islands#redDotIcon',
                            iconContent: String(index + 1),
                            hideIconOnBalloonOpen: false
                        };

                        if (SafeHintLayout) {
                            placemarkOptions.hintLayout = SafeHintLayout;
                            placemarkOptions.hintOffset = [15, 15];
                        }

                        const placemark = new ymaps.Placemark(coords, { safeData }, placemarkOptions);
                        map.geoObjects.add(placemark);
                    });

                    if (validPoints.length > 1) {
                        const polyline = new ymaps.Polyline(
                            validPoints.map(p => [p.latParsed, p.lonParsed]),
                            {},
                            { strokeColor: "#b3342b", strokeWidth: 3, strokeOpacity: 0.6 }
                        );
                        map.geoObjects.add(polyline);
                    }

                    safeSetBounds(map, validPoints);
                }
            }

            // VIEW_ROUTE_DETAILS MODE
            else if (uiMode === UI_MODE.VIEW_ROUTE_DETAILS && currentRoute && currentRoute.points && currentRoute.points.length > 0) {
                const validPoints = currentRoute.points
                    .map(point => {
                        const lat = parseFloat(point.lat);
                        const lon = parseFloat(point.lon);
                        return !isNaN(lat) && !isNaN(lon) ? { ...point, latParsed: lat, lonParsed: lon } : null;
                    })
                    .filter(Boolean);

                if (validPoints.length > 0) {
                    validPoints.forEach((point, index) => {
                        const coords = [point.latParsed, point.lonParsed];
                        const safeData = createSafePlacemarkData(point);

                        const placemarkOptions = {
                            preset: 'islands#blueDotIcon',
                            iconContent: String(index + 1),
                            hideIconOnBalloonOpen: false,
                            balloonMaxWidth: 350
                        };

                        if (SafeHintLayout) {
                            placemarkOptions.hintLayout = SafeHintLayout;
                            placemarkOptions.hintOffset = [15, 15];
                        }

                        const placemark = new ymaps.Placemark(coords, { safeData }, placemarkOptions);
                        map.geoObjects.add(placemark);
                    });

                    if (validPoints.length > 1) {
                        const polyline = new ymaps.Polyline(
                            validPoints.map(p => [p.latParsed, p.lonParsed]),
                            {},
                            { strokeColor: "#0000FF", strokeWidth: 4, strokeOpacity: 0.8 }
                        );
                        map.geoObjects.add(polyline);
                    }

                    safeSetBounds(map, validPoints);
                }
            }

            // CREATE/EDIT ROUTE MODE
            else if ((uiMode === UI_MODE.CREATE_ROUTE || uiMode === UI_MODE.EDIT_ROUTE) && currentRoute && currentRoute.points && currentRoute.points.length > 0) {
                const validPoints = currentRoute.points
                    .map(point => {
                        const lat = parseFloat(point.lat);
                        const lon = parseFloat(point.lon);
                        return !isNaN(lat) && !isNaN(lon) ? { ...point, latParsed: lat, lonParsed: lon } : null;
                    })
                    .filter(Boolean);

                if (validPoints.length > 0) {
                    validPoints.forEach((point, index) => {
                        const coords = [point.latParsed, point.lonParsed];
                        const safeData = createSafePlacemarkData(point);

                        const placemarkOptions = {
                            preset: 'islands#greenDotIcon',
                            iconContent: String(index + 1),
                            hideIconOnBalloonOpen: false
                        };

                        if (SafeHintLayout) {
                            placemarkOptions.hintLayout = SafeHintLayout;
                            placemarkOptions.hintOffset = [15, 15];
                        }

                        const placemark = new ymaps.Placemark(coords, { safeData }, placemarkOptions);

                        placemark.events.add('click', (e) => {
                            e.stopPropagation();
                            onEditPoint(point, index);
                        });

                        map.geoObjects.add(placemark);
                    });

                    if (validPoints.length > 1) {
                        const polyline = new ymaps.Polyline(
                            validPoints.map(p => [p.latParsed, p.lonParsed]),
                            {},
                            { strokeColor: "#536C45", strokeWidth: 4, strokeOpacity: 0.8 }
                        );
                        map.geoObjects.add(polyline);
                    }

                    safeSetBounds(map, validPoints);
                }
            }

            // TEMP POINT MODE
            else if (tempPointCoords && (uiMode === UI_MODE.CREATE_ROUTE || uiMode === UI_MODE.EDIT_ROUTE)) {
                const tempPlacemark = new ymaps.Placemark(tempPointCoords, {
                    hintContent: 'Новая точка'
                }, {
                    preset: 'islands#redDotIcon',
                    draggable: true
                });

                map.geoObjects.add(tempPlacemark);
                map.setCenter(tempPointCoords, 14);
            }
        } catch (error) {
            console.error('Error updating map:', error);
        }

    }, [apiLoaded, uiMode, currentRoute, previewRoute, tempPointCoords, pointToEdit, onEditPoint, mapReady]);

    if (!apiLoaded) {
        return (
            <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f0f0f0'
            }}>
                <p>Загрузка карты...</p>
            </div>
        );
    }

    return <div id="yandex-map" ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />;
}

export default YandexMap;
