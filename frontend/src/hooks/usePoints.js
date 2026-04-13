import { useCallback } from 'react';
import { LIMITS, LIMIT_MESSAGES, checkLimits } from '../constants/limits';
import { ACTION_TYPES, UI_MODE } from '../constants/uiModes';
import { useAuth } from '../contexts/AuthContext';   // добавлено

/**
 * Хук для работы с точками маршрута
 * @param {Object} state - Текущее состояние приложения
 * @param {Function} dispatch - Функция dispatch для обновления состояния
 * @returns {Object} Методы для работы с точками
 */
export const usePoints = (state, dispatch) => {
    const { currentRoute, quickCreateMode } = state;
    const { profile } = useAuth();   // добавлено
    const maxPointsPerRoute = profile?.max_points_per_route || LIMITS.MAX_POINTS_PER_ROUTE;   // добавлено

    /**
     * Начать создание точки через клик на карте
     */
    const startCreatePointWithMapClick = useCallback(() => {
        const currentPointsCount = currentRoute?.points?.length || 0;
        if (currentPointsCount >= maxPointsPerRoute) {   // изменено
            alert(`Достигнут лимит точек в маршруте (${maxPointsPerRoute}). Обновите подписку.`);
            return;
        }
        console.log('Activating map click mode for point creation...');
        dispatch({ type: ACTION_TYPES.SET_WAITING_FOR_COORDINATES, payload: true });
    }, [currentRoute, maxPointsPerRoute, dispatch]);

    /**
     * Начать создание точки вручную (без карты)
     */
    const startCreatePointManual = useCallback(() => {
        const currentPointsCount = currentRoute?.points?.length || 0;
        if (currentPointsCount >= maxPointsPerRoute) {   // изменено
            alert(`Достигнут лимит точек в маршруте (${maxPointsPerRoute}). Обновите подписку.`);
            return;
        }
        console.log('Starting manual point creation (empty form)');
        dispatch({ type: ACTION_TYPES.SET_UI_MODE, payload: UI_MODE.CREATE_POINT });
        dispatch({
            type: ACTION_TYPES.SET_POINT_TO_EDIT,
            payload: {
                id: `temp_point_${Date.now()}`,
                name: '',
                description: '',
                lat: '',
                lon: '',
                images: [],
                manualInput: true
            }
        });
        dispatch({ type: ACTION_TYPES.SET_WAITING_FOR_COORDINATES, payload: false });
    }, [currentRoute, maxPointsPerRoute, dispatch]);

    /**
     * Начать редактирование существующей точки
     */
    const startEditPoint = useCallback((pointData, pointIndex) => {
        console.log('Starting edit point:', pointData);
        dispatch({ type: ACTION_TYPES.SET_UI_MODE, payload: UI_MODE.EDIT_POINT });
        dispatch({
            type: ACTION_TYPES.SET_POINT_TO_EDIT,
            payload: { ...pointData, index: pointIndex }
        });
    }, [dispatch]);

    /**
     * Сохранение точки (создание или обновление)
     */
    const handleSavePoint = useCallback((pointData, pointIndex = null) => {
        console.log('Saving point data:', pointData);

        if (!checkLimits.isTextLengthValid(pointData.name, LIMITS.MAX_POINT_NAME_LENGTH)) {
            alert(LIMIT_MESSAGES.MAX_POINT_NAME);
            return;
        }

        if (!checkLimits.isTextLengthValid(pointData.description, LIMITS.MAX_POINT_DESCRIPTION_LENGTH)) {
            alert(LIMIT_MESSAGES.MAX_POINT_DESCRIPTION);
            return;
        }

        let targetRoute = currentRoute;
        let uiModeAfterSave = UI_MODE.EDIT_ROUTE;

        if (!targetRoute) {
            targetRoute = {
                id: `temp_${Date.now()}`,
                name: '',
                description: '',
                points: []
            };
            uiModeAfterSave = UI_MODE.CREATE_ROUTE;
        }

        // Проверка лимита перед добавлением новой точки
        if (pointIndex === null && targetRoute.points.length >= maxPointsPerRoute) {
            alert(`Достигнут лимит точек в маршруте (${maxPointsPerRoute}). Обновите подписку.`);
            return;
        }

        const updatedPoints = (pointIndex !== null && typeof targetRoute.points[pointIndex] !== 'undefined')
            ? targetRoute.points.map((p, idx) => idx === pointIndex ? { ...p, ...pointData } : p)
            : [...targetRoute.points, { ...pointData, id: `temp_point_${Date.now()}` }];

        console.log('Updated points:', updatedPoints);
        dispatch({
            type: ACTION_TYPES.SET_CURRENT_ROUTE,
            payload: { ...targetRoute, points: updatedPoints }
        });
        dispatch({ type: ACTION_TYPES.SET_UI_MODE, payload: uiModeAfterSave });
        dispatch({ type: ACTION_TYPES.CLEAR_POINT_TO_EDIT });
    }, [currentRoute, maxPointsPerRoute, dispatch]);

    /**
     * Удаление точки из текущего маршрута
     */
    const handleDeletePoint = useCallback((pointId) => {
        if (!currentRoute) return;
        const updatedPoints = currentRoute.points.filter(p => p.id !== pointId);
        dispatch({
            type: ACTION_TYPES.UPDATE_CURRENT_ROUTE_POINTS,
            payload: updatedPoints
        });
    }, [currentRoute, dispatch]);

    /**
     * Отмена создания/редактирования точки
     */
    const handleCancelPointForm = useCallback((showMainList) => {
        dispatch({ type: ACTION_TYPES.CLEAR_POINT_TO_EDIT });

        if (quickCreateMode && (!currentRoute?.points || currentRoute.points.length === 0)) {
            console.log('🔙 Canceling quick create, returning to main list');
            showMainList();
            return;
        }

        if (currentRoute && typeof currentRoute.id === 'number') {
            dispatch({ type: ACTION_TYPES.SET_UI_MODE, payload: UI_MODE.EDIT_ROUTE });
        } else if (currentRoute) {
            dispatch({ type: ACTION_TYPES.SET_UI_MODE, payload: UI_MODE.CREATE_ROUTE });
        } else {
            showMainList();
        }
    }, [currentRoute, quickCreateMode, dispatch]);

    /**
     * Изменение порядка точек (drag & drop)
     */
    const handleDragEndPoints = useCallback((newOrderedPoints) => {
        dispatch({
            type: ACTION_TYPES.UPDATE_CURRENT_ROUTE_POINTS,
            payload: newOrderedPoints
        });
    }, [dispatch]);

    return {
        startCreatePointWithMapClick,
        startCreatePointManual,
        startEditPoint,
        handleSavePoint,
        handleDeletePoint,
        handleCancelPointForm,
        handleDragEndPoints,
    };
};