// src/hooks/useRoutes.js
import { useState, useCallback } from 'react';
import { routesApi } from '../api/routes';
import { pointsApi } from '../api/points';
import { processImages } from '../utils/imageHelpers';
import { LIMITS, LIMIT_MESSAGES, checkLimits } from '../constants/limits';

/**
 * Custom hook для работы с маршрутами
 */
export const useRoutes = () => {
    const [routes, setRoutes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Обработка изображений в маршрутах
     */
    const processRoutesFromServer = useCallback((routesData) => {
        if (!routesData) return [];

        return routesData.map(route => ({
            ...route,
            points: route.points.map(point => ({
                ...point,
                images: processImages(point.images || [])
            }))
        }));
    }, []);

    /**
     * Загрузка всех маршрутов
     */
    const fetchRoutes = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            console.log('📡 Fetching routes from API...');
            const routesData = await routesApi.getAll();
            console.log('📦 Raw API response:', routesData);

            const processedData = processRoutesFromServer(routesData);
            setRoutes(processedData);

            return processedData;
        } catch (err) {
            console.error('❌ Ошибка загрузки маршрутов:', err);
            setError('Не удалось загрузить маршруты.');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [processRoutesFromServer]);

    /**
     * Сохранение маршрута (создание или обновление)
     */
    const saveRoute = useCallback(async (routeData) => {
        console.log('💾 Saving route data:', routeData);

        // Валидация перед сохранением
        if (!checkLimits.isTextLengthValid(routeData.name, LIMITS.MAX_ROUTE_NAME_LENGTH)) {
            throw new Error(LIMIT_MESSAGES.MAX_ROUTE_NAME);
        }

        if (!checkLimits.isTextLengthValid(routeData.description, LIMITS.MAX_ROUTE_DESCRIPTION_LENGTH)) {
            throw new Error(LIMIT_MESSAGES.MAX_ROUTE_DESCRIPTION);
        }

        setIsLoading(true);
        setError(null);

        try {
            // Собираем изображения для загрузки
            const imagesToUploadByPoint = [];
            const dataToSend = {
                name: routeData.name,
                description: routeData.description,
                points: routeData.points.map((point, index) => {
                    const newImages = (point.images || []).filter(img =>
                        typeof img === 'string' && img.startsWith('data:image')
                    );

                    if (newImages.length > 0) {
                        console.log(`Point ${index} has ${newImages.length} new images to upload`);
                        imagesToUploadByPoint.push({ pointIndex: index, images: newImages });
                    }

                    const { index: pointIndex, images, ...pointToSend } = point;
                    return pointToSend;
                })
            };

            console.log('Data to send to server:', dataToSend);

            // Создание или обновление маршрута
            const isExisting = typeof routeData.id === 'number';
            const savedRoute = isExisting
                ? await routesApi.update(routeData.id, dataToSend)
                : await routesApi.create(dataToSend);

            console.log('Route save response:', savedRoute);

            // Загрузка изображений
            if (imagesToUploadByPoint.length > 0) {
                console.log('Uploading images for points:', imagesToUploadByPoint);

                const uploadPromises = imagesToUploadByPoint.map(({ pointIndex, images }) => {
                    const pointId = savedRoute.points[pointIndex]?.id;
                    if (pointId && images.length > 0) {
                        console.log(`Uploading ${images.length} images for point ${pointId}`);
                        return pointsApi.uploadImages(pointId, images);
                    }
                    return Promise.resolve();
                });

                const uploadResults = await Promise.all(uploadPromises);
                console.log('Image upload results:', uploadResults);
            }

            // Перезагружаем все маршруты
            console.log('Reloading all routes after save...');
            await fetchRoutes();

            return savedRoute;
        } catch (err) {
            console.error('❌ Ошибка сохранения маршрута:', err);
            const errorDetail = err.response?.data ? JSON.stringify(err.response.data) : 'Нет деталей.';
            const errorMessage = `Не удалось сохранить маршрут. Ответ сервера: ${errorDetail}`;
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [fetchRoutes]);

    /**
     * Удаление маршрута
     */
    const deleteRoute = useCallback(async (routeId) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот маршрут?')) {
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            await routesApi.delete(routeId);

            // Обновляем локальное состояние
            setRoutes(prevRoutes => prevRoutes.filter(r => r.id !== routeId));

            return true;
        } catch (err) {
            console.error('❌ Ошибка удаления маршрута:', err);
            setError('Не удалось удалить маршрут.');
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Проверка возможности создания нового маршрута
     */
    const canCreateRoute = useCallback(() => {
        return checkLimits.canCreateRoute(routes.length);
    }, [routes.length]);

    return {
        routes,
        isLoading,
        error,
        fetchRoutes,
        saveRoute,
        deleteRoute,
        canCreateRoute,
        setError
    };
};
