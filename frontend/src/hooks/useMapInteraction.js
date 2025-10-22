import { useCallback } from 'react';
import { LIMITS, LIMIT_MESSAGES, checkLimits } from '../constants/limits';
import { ACTION_TYPES, UI_MODE } from '../constants/uiModes';

/**
 * Хук для обработки взаимодействия с картой
 * @param {Object} state - Текущее состояние приложения
 * @param {Function} dispatch - Функция dispatch для обновления состояния
 * @returns {Object} Методы для работы с картой
 */
export const useMapInteraction = (state, dispatch) => {
    const { uiMode, waitingForCoordinates, currentRoute, routes } = state;

    /**
     * Обработка клика по карте для создания точки
     */
    const handleMapClickForPointCreation = useCallback((coords) => {
        console.log('🗺️ Map clicked with coords:', coords, 'UI mode:', uiMode, 'Waiting for coordinates:', waitingForCoordinates);

        // Быстрое создание маршрута из главного списка
        if (uiMode === UI_MODE.MAIN_LIST && !waitingForCoordinates) {
            console.log('⚡ Quick create mode from main list');

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
            dispatch({ type: ACTION_TYPES.SET_QUICK_CREATE_MODE, payload: true });
            dispatch({
                type: ACTION_TYPES.SET_POINT_TO_EDIT,
                payload: {
                    id: `temp_point_${Date.now()}`,
                    name: '',
                    description: '',
                    lat: coords[0],
                    lon: coords[1],
                    images: []
                }
            });
            dispatch({ type: ACTION_TYPES.SET_TEMP_POINT_COORDS, payload: coords });
            dispatch({ type: ACTION_TYPES.SET_UI_MODE, payload: UI_MODE.CREATE_POINT });
            return;
        }

        // Стандартный режим создания точки
        if (waitingForCoordinates) {
            const currentPointsCount = currentRoute?.points?.length || 0;
            if (currentRoute && !checkLimits.canAddPoint(currentPointsCount)) {
                alert(LIMIT_MESSAGES.MAX_POINTS);
                dispatch({ type: ACTION_TYPES.SET_WAITING_FOR_COORDINATES, payload: false });
                return;
            }

            console.log('✅ Creating point with coordinates from map click (standard flow)');
            dispatch({ type: ACTION_TYPES.SET_UI_MODE, payload: UI_MODE.CREATE_POINT });
            dispatch({
                type: ACTION_TYPES.SET_POINT_TO_EDIT,
                payload: {
                    id: `temp_point_${Date.now()}`,
                    name: '',
                    description: '',
                    lat: coords[0],
                    lon: coords[1],
                    images: []
                }
            });
            dispatch({ type: ACTION_TYPES.SET_TEMP_POINT_COORDS, payload: coords });
            dispatch({ type: ACTION_TYPES.SET_WAITING_FOR_COORDINATES, payload: false });
        }
    }, [uiMode, waitingForCoordinates, currentRoute, routes.length, dispatch]);

    return {
        handleMapClickForPointCreation,
    };
};
