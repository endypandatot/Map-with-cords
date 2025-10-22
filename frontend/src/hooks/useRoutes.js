import { useCallback } from 'react';
import { routesApi, pointsApi } from '../api';
import { LIMITS, LIMIT_MESSAGES, checkLimits } from '../constants/limits';
import { ACTION_TYPES, UI_MODE } from '../constants/uiModes';

/**
 * Хук для работы с маршрутами
 * @param {Object} state - Текущее состояние приложения
 * @param {Function} dispatch - Функция dispatch для обновления состояния
 * @returns {Object} Методы для работы с маршрутами
 */
export const useRoutes = (state, dispatch) => {
    const { routes } = state;

    /**
     * Загрузка всех маршрутов с сервера
     */
    const fetchRoutes = useCallback(async () => {
        try {
            dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });
            const data = await routesApi.getAll();
            dispatch({ type: ACTION_TYPES.FETCH_ROUTES_SUCCESS, payload: data });
        } catch (error) {
            console.error('Error fetching routes:', error);
            dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
        } finally {
            dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false });
        }
    }, [dispatch]);

    /**
     * Начать создание нового маршрута
     */
    const startCreateRoute = useCallback(() => {
        if (!checkLimits.canCreateRoute(routes.length)) {
            alert(LIMIT_MESSAGES.MAX_ROUTES);
            return;
        }

        const newRoute = {
            id: `temp_${Date.now()}`,
            name: '',
            description: '',
            points: []
        };

        dispatch({ type: ACTION_TYPES.SET_CURRENT_ROUTE, payload: newRoute });
        dispatch({ type: ACTION_TYPES.SET_UI_MODE, payload: UI_MODE.CREATE_ROUTE });
    }, [routes.length, dispatch]);

    /**
     * Начать редактирование существующего маршрута
     */
    const startEditRoute = useCallback((routeId) => {
        const routeToEdit = routes.find(r => r.id === routeId);
        if (routeToEdit) {
            const clonedRoute = structuredClone(routeToEdit);
            dispatch({ type: ACTION_TYPES.SET_CURRENT_ROUTE, payload: clonedRoute });
            dispatch({ type: ACTION_TYPES.SET_UI_MODE, payload: UI_MODE.EDIT_ROUTE });
        }
    }, [routes, dispatch]);

    /**
     * Начать просмотр маршрута (режим только для чтения)
     */
    const startViewRoute = useCallback((routeId) => {
        const routeToView = routes.find(r => r.id === routeId);
        if (routeToView) {
            const clonedRoute = structuredClone(routeToView);
            dispatch({ type: ACTION_TYPES.SET_CURRENT_ROUTE, payload: clonedRoute });
            dispatch({ type: ACTION_TYPES.SET_UI_MODE, payload: UI_MODE.VIEW_ROUTE_DETAILS });
        }
    }, [routes, dispatch]);

    /**
     * Сохранение маршрута (создание или обновление)
     */
    const handleSaveRoute = useCallback(async (routeData) => {
        console.log('💾 Starting route save process...');
        console.log('💾 Route data:', routeData);
        console.log('💾 Points with images:', routeData.points?.map(p => ({
            name: p.name,
            id: p.id,
            imagesCount: p.images?.length || 0
        })));

        try {
            dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });

            let savedRoute;
            if (routeData.id && typeof routeData.id === 'number') {
                // Обновление существующего маршрута
                console.log('📝 Updating existing route:', routeData.id);
                savedRoute = await routesApi.update(routeData.id, routeData);
                console.log('✅ Route updated successfully:', savedRoute);
            } else {
                // Создание нового маршрута
                console.log('➕ Creating new route');
                savedRoute = await routesApi.create(routeData);
                console.log('✅ Route created successfully:', savedRoute);
            }

            console.log('📤 Starting image upload process...');
            console.log('📤 Saved route points:', savedRoute.points);
            console.log('📤 Original route points:', routeData.points);

            // Проходим по точкам в том же порядке (индексы совпадают)
            for (let i = 0; i < savedRoute.points.length; i++) {
                const savedPoint = savedRoute.points[i];
                const originalPoint = routeData.points[i];

                console.log(`📤 Processing point ${i}:`, {
                    savedPointName: savedPoint.name,
                    savedPointId: savedPoint.id,
                    originalPointName: originalPoint?.name,
                    originalPointImages: originalPoint?.images?.length || 0
                });

                if (originalPoint && originalPoint.images && originalPoint.images.length > 0) {
                    const base64Images = originalPoint.images.filter(img =>
                        typeof img === 'string' && img.startsWith('data:image/')
                    );

                    console.log(`📤 Found ${base64Images.length} new images to upload for point ${savedPoint.id}`);

                    if (base64Images.length > 0) {
                        try {
                            console.log(`📤 Uploading ${base64Images.length} images for point ${savedPoint.id}...`);
                            await pointsApi.uploadImages(savedPoint.id, base64Images);
                            console.log(`✅ Images uploaded successfully for point ${savedPoint.id}`);
                        } catch (uploadError) {
                            console.error(`❌ Error uploading images for point ${savedPoint.id}:`, uploadError);
                            alert(`Ошибка при загрузке изображений для точки "${savedPoint.name}"`);
                        }
                    } else {
                        console.log(`ℹ️ No new images to upload for point ${savedPoint.id}`);
                    }
                } else {
                    console.log(`ℹ️ No images for point ${savedPoint.id}`);
                }
            }

            console.log('✅ All images processed');

            // Перезагружаем все маршруты
            await fetchRoutes();

            // Возвращаемся к главному списку
            dispatch({ type: ACTION_TYPES.CLEAR_CURRENT_ROUTE });
            dispatch({ type: ACTION_TYPES.SET_UI_MODE, payload: UI_MODE.MAIN_LIST });
        } catch (error) {
            console.error('❌ Error saving route:', error);
            alert('Ошибка при сохранении маршрута. Проверьте консоль для деталей.');
            dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
        } finally {
            dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false });
        }
    }, [dispatch, fetchRoutes]);

    /**
     * Удаление маршрута
     */
    const handleDeleteRoute = useCallback(async (routeId) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот маршрут?')) {
            return;
        }

        try {
            dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });
            await routesApi.delete(routeId);
            console.log(`✅ Route ${routeId} deleted successfully`);
            await fetchRoutes();
        } catch (error) {
            console.error('Error deleting route:', error);
            alert('Ошибка при удалении маршрута.');
            dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
        } finally {
            dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false });
        }
    }, [dispatch, fetchRoutes]);

    /**
     * Показать главный список маршрутов
     */
    const showMainList = useCallback(() => {
        dispatch({ type: ACTION_TYPES.CLEAR_CURRENT_ROUTE });
        dispatch({ type: ACTION_TYPES.CLEAR_PREVIEW_ROUTE });
        dispatch({ type: ACTION_TYPES.SET_UI_MODE, payload: UI_MODE.MAIN_LIST });
        dispatch({ type: ACTION_TYPES.SET_WAITING_FOR_COORDINATES, payload: false });
        dispatch({ type: ACTION_TYPES.SET_QUICK_CREATE_MODE, payload: false });
    }, [dispatch]);

    /**
     * Начать предпросмотр маршрута при наведении
     */
    const handleRouteHoverStart = useCallback((routeId) => {
        const route = routes.find(r => r.id === routeId);
        if (route) {
            dispatch({ type: ACTION_TYPES.SET_PREVIEW_ROUTE, payload: route });
        }
    }, [routes, dispatch]);

    /**
     * Завершить предпросмотр маршрута
     */
    const handleRouteHoverEnd = useCallback(() => {
        dispatch({ type: ACTION_TYPES.CLEAR_PREVIEW_ROUTE });
    }, [dispatch]);

    return {
        fetchRoutes,
        startCreateRoute,
        startEditRoute,
        startViewRoute,
        handleSaveRoute,
        handleDeleteRoute,
        showMainList,
        handleRouteHoverStart,
        handleRouteHoverEnd,
    };
};
