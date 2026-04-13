import { useCallback } from 'react';
import { routesApi, pointsApi } from '../api';
import { LIMITS, LIMIT_MESSAGES } from '../constants/limits';
import { ACTION_TYPES, UI_MODE } from '../constants/uiModes';
import { useAuth } from '../contexts/AuthContext';

/**
 * Хук для работы с маршрутами
 * @param {Object} state - Текущее состояние приложения
 * @param {Function} dispatch - Функция dispatch для обновления состояния
 * @param {boolean} isAuthenticated - Авторизован ли пользователь
 * @returns {Object} Методы для работы с маршрутами
 */
export const useRoutes = (state, dispatch, isAuthenticated) => {
    const { routes } = state;
    const { profile } = useAuth();

    const fetchRoutes = useCallback(async () => {
        if (!isAuthenticated) {
            dispatch({ type: ACTION_TYPES.FETCH_ROUTES_SUCCESS, payload: [] });
            return;
        }

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
    }, [isAuthenticated, dispatch]);

    const startCreateRoute = useCallback(() => {
        let maxRoutes;
        if (isAuthenticated && profile) {
            maxRoutes = profile.max_routes;
        } else {
            maxRoutes = LIMITS.MAX_ROUTES;
        }

        if (routes.length >= maxRoutes) {
            alert(`Достигнут лимит маршрутов (${maxRoutes}). ${!isAuthenticated ? 'Зарегистрируйтесь или обновите подписку для увеличения лимита.' : 'Обновите подписку для увеличения лимита.'}`);
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
    }, [routes.length, isAuthenticated, profile, dispatch]);

    const startEditRoute = useCallback((routeId) => {
        const routeToEdit = routes.find(r => r.id === routeId);
        if (routeToEdit) {
            const clonedRoute = structuredClone(routeToEdit);
            dispatch({ type: ACTION_TYPES.SET_CURRENT_ROUTE, payload: clonedRoute });
            dispatch({ type: ACTION_TYPES.SET_UI_MODE, payload: UI_MODE.EDIT_ROUTE });
        }
    }, [routes, dispatch]);

    const startViewRoute = useCallback((routeId) => {
        const routeToView = routes.find(r => r.id === routeId);
        if (routeToView) {
            const clonedRoute = structuredClone(routeToView);
            dispatch({ type: ACTION_TYPES.SET_CURRENT_ROUTE, payload: clonedRoute });
            dispatch({ type: ACTION_TYPES.SET_UI_MODE, payload: UI_MODE.VIEW_ROUTE_DETAILS });
        }
    }, [routes, dispatch]);

    const handleSaveRoute = useCallback(async (routeData) => {
        console.log('💾 Starting route save process...');

        // Анонимный режим
        if (!isAuthenticated) {
            console.log('👤 Anonymous mode: saving route locally');
            const existingIndex = routes.findIndex(r => r.id === routeData.id);
            if (existingIndex !== -1) {
                dispatch({ type: ACTION_TYPES.UPDATE_ROUTE, payload: routeData });
                console.log('✅ Route updated locally');
            } else {
                const newRoute = { ...routeData, id: Date.now() };
                dispatch({ type: ACTION_TYPES.ADD_ROUTE, payload: newRoute });
                console.log('✅ Route added locally');
            }
            dispatch({ type: ACTION_TYPES.CLEAR_CURRENT_ROUTE });
            dispatch({ type: ACTION_TYPES.SET_UI_MODE, payload: UI_MODE.MAIN_LIST });
            return;
        }

        // Авторизованный режим
        try {
            dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });

            let savedRoute;  // объявляем переменную здесь

            // Проверка лимита точек в маршруте (если обновляем)
            if (routeData.id && typeof routeData.id === 'number') {
                console.log('📝 Updating existing route:', routeData.id);
                // Отправляем только разрешённые поля
                const updateData = {
                    name: routeData.name,
                    description: routeData.description,
                    points: routeData.points
                };
                savedRoute = await routesApi.update(routeData.id, updateData);
                console.log('✅ Route updated successfully:', savedRoute);
            } else {
                console.log('➕ Creating new route');
                savedRoute = await routesApi.create(routeData);
                console.log('✅ Route created successfully:', savedRoute);
            }

            console.log('📤 Starting image upload process...');
            for (let i = 0; i < savedRoute.points.length; i++) {
                const savedPoint = savedRoute.points[i];
                const originalPoint = routeData.points[i];

                if (originalPoint && originalPoint.images && originalPoint.images.length > 0) {
                    const base64Images = originalPoint.images.filter(img =>
                        typeof img === 'string' && img.startsWith('data:image/')
                    );

                    if (base64Images.length > 0) {
                        try {
                            console.log(`📤 Uploading ${base64Images.length} images for point ${savedPoint.id}...`);
                            await pointsApi.uploadImages(savedPoint.id, base64Images);
                            console.log(`✅ Images uploaded successfully for point ${savedPoint.id}`);
                        } catch (uploadError) {
                            console.error(`❌ Error uploading images for point ${savedPoint.id}:`, uploadError);
                            alert(`Ошибка при загрузке изображений для точки "${savedPoint.name}"`);
                        }
                    }
                }
            }

            console.log('✅ All images processed');
            await fetchRoutes();
            dispatch({ type: ACTION_TYPES.CLEAR_CURRENT_ROUTE });
            dispatch({ type: ACTION_TYPES.SET_UI_MODE, payload: UI_MODE.MAIN_LIST });
        } catch (error) {
            console.error('❌ Error saving route:', error);
            if (error.response?.data?.points) {
                alert(`Ошибка: ${error.response.data.points}`);
            } else if (error.response?.data?.detail) {
                alert(error.response.data.detail);
            } else {
                alert('Ошибка при сохранении маршрута. Проверьте консоль для деталей.');
            }
            dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
        } finally {
            dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false });
        }
    }, [isAuthenticated, routes, profile, dispatch, fetchRoutes]);

    const handleDeleteRoute = useCallback(async (routeId) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот маршрут?')) {
            return;
        }

        if (!isAuthenticated) {
            console.log('👤 Anonymous mode: deleting route locally');
            dispatch({ type: ACTION_TYPES.DELETE_ROUTE, payload: routeId });
            if (state.currentRoute?.id === routeId) {
                dispatch({ type: ACTION_TYPES.CLEAR_CURRENT_ROUTE });
            }
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
    }, [isAuthenticated, state.currentRoute, dispatch, fetchRoutes]);

    const showMainList = useCallback(() => {
        dispatch({ type: ACTION_TYPES.CLEAR_CURRENT_ROUTE });
        dispatch({ type: ACTION_TYPES.CLEAR_PREVIEW_ROUTE });
        dispatch({ type: ACTION_TYPES.SET_UI_MODE, payload: UI_MODE.MAIN_LIST });
        dispatch({ type: ACTION_TYPES.SET_WAITING_FOR_COORDINATES, payload: false });
        dispatch({ type: ACTION_TYPES.SET_QUICK_CREATE_MODE, payload: false });
    }, [dispatch]);

    const handleRouteHoverStart = useCallback((routeId) => {
        const route = routes.find(r => r.id === routeId);
        if (route) {
            dispatch({ type: ACTION_TYPES.SET_PREVIEW_ROUTE, payload: route });
        }
    }, [routes, dispatch]);

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