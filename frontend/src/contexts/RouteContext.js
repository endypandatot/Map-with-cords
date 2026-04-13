import React, { createContext, useReducer, useEffect, useContext } from 'react';
import { appReducer, initialState } from '../reducers/appReducer';
import { useRoutes } from '../hooks/useRoutes';
import { usePoints } from '../hooks/usePoints';
import { useMapInteraction } from '../hooks/useMapInteraction';
import { useAuth } from './AuthContext';

/**
 * Контекст для управления маршрутами и точками
 */
export const RouteContext = createContext();

/**
 * Провайдер контекста маршрутов
 */
export const RouteProvider = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);

    // Получаем данные авторизации
    const { user } = useAuth();
    const isAuthenticated = !!user;

    // Подключаем хуки, передавая isAuthenticated в useRoutes
    const routeHandlers = useRoutes(state, dispatch, isAuthenticated);
    const pointHandlers = usePoints(state, dispatch);
    const mapHandlers = useMapInteraction(state, dispatch);

    // Загрузка маршрутов при монтировании и при изменении статуса авторизации
    useEffect(() => {
        routeHandlers.fetchRoutes();
    }, [isAuthenticated, routeHandlers.fetchRoutes]);

    // Логирование изменений currentRoute (для отладки)
    useEffect(() => {
        console.log('🗺️ Current Route changed:', {
            name: state.currentRoute?.name,
            pointsCount: state.currentRoute?.points?.length || 0,
            points: state.currentRoute?.points?.map(p => ({
                id: p.id,
                name: p.name,
                lat: p.lat,
                lon: p.lon
            })) || []
        });
    }, [state.currentRoute]);

    // Формируем значение контекста
    const contextValue = {
        // Состояние
        ...state,

        // Обработчики маршрутов
        ...routeHandlers,

        // Обработчики точек
        ...pointHandlers,

        // Обработчики карты
        ...mapHandlers,

        // Dispatch для прямого доступа (если нужно)
        dispatch,
    };

    return (
        <RouteContext.Provider value={contextValue}>
            {children}
        </RouteContext.Provider>
    );
};

/**
 * Хук для использования контекста маршрутов
 */
export const useRouteContext = () => {
    const context = useContext(RouteContext);
    if (!context) {
        throw new Error('useRouteContext must be used within RouteProvider');
    }
    return context;
};