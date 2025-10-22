import { ACTION_TYPES, UI_MODE } from '../constants/uiModes';

/**
 * Начальное состояние приложения
 */
export const initialState = {
    routes: [],
    currentRoute: null,
    previewRoute: null,
    pointToEdit: null,
    tempPointCoords: null,
    uiMode: UI_MODE.MAIN_LIST,
    isLoading: true,
    error: null,
    waitingForCoordinates: false,
    quickCreateMode: false,
};

/**
 * Редьюсер для управления состоянием приложения
 * @param {Object} state - Текущее состояние
 * @param {Object} action - Действие с типом и payload
 * @returns {Object} Новое состояние
 */
export function appReducer(state, action) {
    switch (action.type) {
        // Загрузка и ошибки
        case ACTION_TYPES.SET_LOADING:
            return { ...state, isLoading: action.payload };

        case ACTION_TYPES.SET_ERROR:
            return { ...state, error: action.payload, isLoading: false };

        // Маршруты
        case ACTION_TYPES.FETCH_ROUTES_SUCCESS:
            return { ...state, routes: action.payload, isLoading: false, error: null };

        case ACTION_TYPES.SET_CURRENT_ROUTE:
            console.log('🚀 SET_CURRENT_ROUTE called with:', action.payload);
            return { ...state, currentRoute: action.payload };

        case ACTION_TYPES.CLEAR_CURRENT_ROUTE:
            return {
                ...state,
                currentRoute: null,
                pointToEdit: null,
                tempPointCoords: null,
                quickCreateMode: false
            };

        case ACTION_TYPES.UPDATE_CURRENT_ROUTE_POINTS:
            if (!state.currentRoute) return state;
            return {
                ...state,
                currentRoute: {
                    ...state.currentRoute,
                    points: action.payload
                }
            };

        // Превью маршрута
        case ACTION_TYPES.SET_PREVIEW_ROUTE:
            return { ...state, previewRoute: action.payload };

        case ACTION_TYPES.CLEAR_PREVIEW_ROUTE:
            return { ...state, previewRoute: null };

        // Точки
        case ACTION_TYPES.SET_POINT_TO_EDIT:
            return { ...state, pointToEdit: action.payload };

        case ACTION_TYPES.CLEAR_POINT_TO_EDIT:
            return {
                ...state,
                pointToEdit: null,
                tempPointCoords: null,
                waitingForCoordinates: false
            };

        case ACTION_TYPES.SET_TEMP_POINT_COORDS:
            return { ...state, tempPointCoords: action.payload };

        // UI режимы
        case ACTION_TYPES.SET_UI_MODE:
            return { ...state, uiMode: action.payload };

        case ACTION_TYPES.SET_WAITING_FOR_COORDINATES:
            return { ...state, waitingForCoordinates: action.payload };

        case ACTION_TYPES.SET_QUICK_CREATE_MODE:
            return { ...state, quickCreateMode: action.payload };

        default:
            return state;
    }
}
