import React, { createContext, useReducer, useEffect, useCallback, useRef } from 'react';
import './style.css';
import { routeApi } from './api';
import { processRoutes } from './utils/imageHelpers';
import { LIMITS, LIMIT_MESSAGES, checkLimits } from './constants/limits';
import RoutesList from './components/RoutesList';
import RouteCreationForm from './components/RouteCreationForm';
import PointCreationForm from './components/PointCreationForm';
import YandexMap from './components/YandexMap';
import AddRouteIcon from './components/SvgIcons/AddRouteIcon';
import CustomScrollbar from './components/CustomScrollbar';

export const UI_MODE = {
    MAIN_LIST: 'MAIN_LIST',
    CREATE_ROUTE: 'CREATE_ROUTE',
    EDIT_ROUTE: 'EDIT_ROUTE',
    CREATE_POINT: 'CREATE_POINT',
    EDIT_POINT: 'EDIT_POINT',
    VIEW_ROUTE_DETAILS: 'VIEW_ROUTE_DETAILS'
};

const initialState = {
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

function appReducer(state, action) {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload, isLoading: false };
        case 'FETCH_ROUTES_SUCCESS':
            return { ...state, routes: action.payload, isLoading: false, error: null };
        case 'SET_UI_MODE':
            return { ...state, uiMode: action.payload };
        case 'SET_CURRENT_ROUTE':
            console.log('🚀 SET_CURRENT_ROUTE called with:', action.payload);
            return { ...state, currentRoute: action.payload };
        case 'CLEAR_CURRENT_ROUTE':
            return { ...state, currentRoute: null, pointToEdit: null, tempPointCoords: null, quickCreateMode: false };
        case 'SET_PREVIEW_ROUTE':
            return { ...state, previewRoute: action.payload };
        case 'CLEAR_PREVIEW_ROUTE':
            return { ...state, previewRoute: null };
        case 'SET_POINT_TO_EDIT':
            return { ...state, pointToEdit: action.payload };
        case 'CLEAR_POINT_TO_EDIT':
            return { ...state, pointToEdit: null, tempPointCoords: null, waitingForCoordinates: false };
        case 'SET_TEMP_POINT_COORDS':
            return { ...state, tempPointCoords: action.payload };
        case 'SET_WAITING_FOR_COORDINATES':
            return { ...state, waitingForCoordinates: action.payload };
        case 'SET_QUICK_CREATE_MODE':
            return { ...state, quickCreateMode: action.payload };
        case 'UPDATE_CURRENT_ROUTE_POINTS':
            if (!state.currentRoute) return state;
            return { ...state, currentRoute: { ...state.currentRoute, points: action.payload } };
        default:
            return state;
    }
}

export const RouteContext = createContext();

function App() {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const { routes, currentRoute, previewRoute, pointToEdit, tempPointCoords, uiMode, waitingForCoordinates, quickCreateMode } = state;
    const routesListRef = useRef(null);

    useEffect(() => {
        console.log('🗺️ Current Route changed:', {
            name: currentRoute?.name,
            pointsCount: currentRoute?.points?.length || 0,
            points: currentRoute?.points?.map(p => ({
                id: p.id,
                name: p.name,
                lat: p.lat,
                lon: p.lon
            })) || []
        });
    }, [currentRoute]);

    useEffect(() => {
        const fetchRoutes = async () => {
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                console.log('📡 Fetching routes from API...');

                const response = await routeApi.getRoutes();
                console.log('📦 Raw API response:', response);

                // response уже является массивом данных (не response.data)
                let routesData;
                if (response && response.results && Array.isArray(response.results)) {
                    console.log('📊 Paginated response detected');
                    routesData = response.results;
                } else if (Array.isArray(response)) {
                    console.log('📊 Array response detected');
                    routesData = response;
                } else {
                    console.error('❌ Unexpected response format:', response);
                    routesData = [];
                }

                const processedData = processRoutes(routesData);
                console.log('✅ Processed routes:', processedData);
                dispatch({ type: 'FETCH_ROUTES_SUCCESS', payload: processedData });
            } catch (err) {
                console.error('❌ Ошибка загрузки маршрутов:', err);
                dispatch({ type: 'SET_ERROR', payload: 'Не удалось загрузить маршруты.' });
            } finally {
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        };
        fetchRoutes();
    }, []);

    const showMainList = useCallback(() => {
        dispatch({ type: 'SET_UI_MODE', payload: UI_MODE.MAIN_LIST });
        dispatch({ type: 'CLEAR_CURRENT_ROUTE' });
        dispatch({ type: 'SET_QUICK_CREATE_MODE', payload: false });
    }, []);

    const startCreateRoute = useCallback(() => {
        if (!checkLimits.canCreateRoute(routes.length)) {
            alert(LIMIT_MESSAGES.MAX_ROUTES);
            return;
        }

        dispatch({ type: 'SET_CURRENT_ROUTE', payload: { id: `temp_${Date.now()}`, name: '', description: '', points: [] } });
        dispatch({ type: 'SET_UI_MODE', payload: UI_MODE.CREATE_ROUTE });
        dispatch({ type: 'CLEAR_POINT_TO_EDIT' });
        dispatch({ type: 'SET_QUICK_CREATE_MODE', payload: false });
    }, [routes.length]);

    const startEditRoute = useCallback((routeId) => {
        const routeToEdit = routes.find(r => r.id === routeId);
        if (routeToEdit) {
            console.log('🔧 Starting edit route:', routeToEdit);
            dispatch({ type: 'SET_UI_MODE', payload: UI_MODE.EDIT_ROUTE });
            dispatch({ type: 'SET_CURRENT_ROUTE', payload: JSON.parse(JSON.stringify(routeToEdit)) });
            dispatch({ type: 'CLEAR_POINT_TO_EDIT' });
            dispatch({ type: 'SET_QUICK_CREATE_MODE', payload: false });
        }
    }, [routes]);

    const startViewRoute = useCallback((routeId) => {
        const routeToView = routes.find(r => r.id === routeId);
        if (routeToView) {
            console.log('👁️ Starting view route:', routeToView);
            dispatch({ type: 'SET_UI_MODE', payload: UI_MODE.VIEW_ROUTE_DETAILS });
            dispatch({ type: 'SET_CURRENT_ROUTE', payload: JSON.parse(JSON.stringify(routeToView)) });
            dispatch({ type: 'CLEAR_POINT_TO_EDIT' });
            dispatch({ type: 'SET_QUICK_CREATE_MODE', payload: false });
        }
    }, [routes]);

    const handleRouteHoverStart = useCallback((routeId) => {
        if (uiMode !== UI_MODE.MAIN_LIST) return;
        const routeToPreview = routes.find(r => r.id === routeId);
        if (routeToPreview) {
            console.log('👁️ Preview route:', routeToPreview.name);
            dispatch({ type: 'SET_PREVIEW_ROUTE', payload: routeToPreview });
        }
    }, [routes, uiMode]);

    const handleRouteHoverEnd = useCallback(() => {
        dispatch({ type: 'CLEAR_PREVIEW_ROUTE' });
    }, []);

    const startCreatePointWithMapClick = useCallback(() => {
        const currentPointsCount = currentRoute?.points?.length || 0;
        if (!checkLimits.canAddPoint(currentPointsCount)) {
            alert(LIMIT_MESSAGES.MAX_POINTS);
            return;
        }
        console.log('Activating map click mode for point creation...');
        dispatch({ type: 'SET_WAITING_FOR_COORDINATES', payload: true });
    }, [currentRoute]);

    const startCreatePointManual = useCallback(() => {
        const currentPointsCount = currentRoute?.points?.length || 0;
        if (!checkLimits.canAddPoint(currentPointsCount)) {
            alert(LIMIT_MESSAGES.MAX_POINTS);
            return;
        }
        console.log('Starting manual point creation (empty form)');
        dispatch({ type: 'SET_UI_MODE', payload: UI_MODE.CREATE_POINT });
        dispatch({ type: 'SET_POINT_TO_EDIT', payload: {
            id: `temp_point_${Date.now()}`,
            name: '',
            description: '',
            lat: '',
            lon: '',
            images: [],
            manualInput: true
        } });
        dispatch({ type: 'SET_WAITING_FOR_COORDINATES', payload: false });
    }, [currentRoute]);

    const startEditPoint = useCallback((pointData, pointIndex) => {
        console.log('Starting edit point:', pointData);
        dispatch({ type: 'SET_UI_MODE', payload: UI_MODE.EDIT_POINT });
        dispatch({ type: 'SET_POINT_TO_EDIT', payload: { ...pointData, index: pointIndex } });
    }, []);

    const handleSaveRoute = useCallback(async (routeData) => {
        console.log('Saving route data:', routeData);

        if (!checkLimits.isTextLengthValid(routeData.name, LIMITS.MAX_ROUTE_NAME_LENGTH)) {
            alert(LIMIT_MESSAGES.MAX_ROUTE_NAME);
            return;
        }

        if (!checkLimits.isTextLengthValid(routeData.description, LIMITS.MAX_ROUTE_DESCRIPTION_LENGTH)) {
            alert(LIMIT_MESSAGES.MAX_ROUTE_DESCRIPTION);
            return;
        }

        dispatch({ type: 'SET_LOADING', payload: true });
        try {
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

            const isExisting = typeof routeData.id === 'number';
            const savedRoute = isExisting
                ? await routeApi.updateRoute(routeData.id, dataToSend)
                : await routeApi.createRoute(dataToSend);

            console.log('Route save response:', savedRoute);

            if (imagesToUploadByPoint.length > 0) {
                console.log('Uploading images for points:', imagesToUploadByPoint);
                const uploadPromises = imagesToUploadByPoint.map(({ pointIndex, images }) => {
                    const pointId = savedRoute.points[pointIndex]?.id;
                    if (pointId && images.length > 0) {
                        console.log(`Uploading ${images.length} images for point ${pointId}`);
                        return routeApi.uploadPointImage(pointId, images);
                    }
                    return Promise.resolve();
                });
                await Promise.all(uploadPromises);
            }

            console.log('Reloading all routes after save...');
            // ИСПРАВЛЕНО: getRoutes() возвращает массив напрямую
            const finalRoutesData = await routeApi.getRoutes();
            const processedFinalData = processRoutes(Array.isArray(finalRoutesData) ? finalRoutesData : []);
            dispatch({ type: 'FETCH_ROUTES_SUCCESS', payload: processedFinalData });
            showMainList();
        } catch (err) {
            console.error('Ошибка сохранения маршрута:', err);
            const errorDetail = err.response?.data ? JSON.stringify(err.response.data) : 'Нет деталей.';
            dispatch({ type: 'SET_ERROR', payload: `Не удалось сохранить маршрут. Ответ сервера: ${errorDetail}` });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, [showMainList]);

    const handleDeleteRoute = useCallback(async (routeId) => {
        if (window.confirm('Вы уверены, что хотите удалить этот маршрут?')) {
            dispatch({ type: 'SET_LOADING', payload: true });
            try {
                await routeApi.deleteRoute(routeId);
                const newRoutes = routes.filter(r => r.id !== routeId);
                dispatch({ type: 'FETCH_ROUTES_SUCCESS', payload: newRoutes });
                if (currentRoute && currentRoute.id === routeId) {
                    showMainList();
                }
            } catch (err) {
                console.error('Ошибка удаления маршрута:', err);
                dispatch({ type: 'SET_ERROR', payload: 'Не удалось удалить маршрут.' });
            } finally {
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        }
    }, [routes, currentRoute, showMainList]);

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
            targetRoute = { id: `temp_${Date.now()}`, name: '', description: '', points: [] };
            uiModeAfterSave = UI_MODE.CREATE_ROUTE;
        }

        const updatedPoints = (pointIndex !== null && typeof targetRoute.points[pointIndex] !== 'undefined')
            ? targetRoute.points.map((p, idx) => idx === pointIndex ? { ...p, ...pointData } : p)
            : [...targetRoute.points, { ...pointData, id: `temp_point_${Date.now()}` }];

        console.log('Updated points:', updatedPoints);
        dispatch({ type: 'SET_CURRENT_ROUTE', payload: { ...targetRoute, points: updatedPoints } });
        dispatch({ type: 'SET_UI_MODE', payload: uiModeAfterSave });
        dispatch({ type: 'CLEAR_POINT_TO_EDIT' });
    }, [currentRoute]);

    const handleDeletePoint = useCallback((pointId) => {
        if (!currentRoute) return;
        const updatedPoints = currentRoute.points.filter(p => p.id !== pointId);
        dispatch({ type: 'UPDATE_CURRENT_ROUTE_POINTS', payload: updatedPoints });
    }, [currentRoute]);

    const handleCancelPointForm = useCallback(() => {
        dispatch({ type: 'CLEAR_POINT_TO_EDIT' });

        if (quickCreateMode && (!currentRoute?.points || currentRoute.points.length === 0)) {
            console.log('🔙 Canceling quick create, returning to main list');
            showMainList();
            return;
        }

        if (currentRoute && typeof currentRoute.id === 'number') {
            dispatch({ type: 'SET_UI_MODE', payload: UI_MODE.EDIT_ROUTE });
        } else if (currentRoute) {
             dispatch({ type: 'SET_UI_MODE', payload: UI_MODE.CREATE_ROUTE });
        } else {
            showMainList();
        }
    }, [currentRoute, quickCreateMode, showMainList]);

    const handleMapClickForPointCreation = useCallback((coords) => {
        console.log('🗺️ Map clicked with coords:', coords, 'UI mode:', uiMode, 'Waiting for coordinates:', waitingForCoordinates);

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

            dispatch({ type: 'SET_CURRENT_ROUTE', payload: newRoute });
            dispatch({ type: 'SET_QUICK_CREATE_MODE', payload: true });
            dispatch({ type: 'SET_POINT_TO_EDIT', payload: {
                id: `temp_point_${Date.now()}`,
                name: '',
                description: '',
                lat: coords[0],
                lon: coords[1],
                images: []
            }});
            dispatch({ type: 'SET_TEMP_POINT_COORDS', payload: coords });
            dispatch({ type: 'SET_UI_MODE', payload: UI_MODE.CREATE_POINT });
            return;
        }

        if (waitingForCoordinates) {
            const currentPointsCount = currentRoute?.points?.length || 0;
            if (currentRoute && !checkLimits.canAddPoint(currentPointsCount)) {
                alert(LIMIT_MESSAGES.MAX_POINTS);
                dispatch({ type: 'SET_WAITING_FOR_COORDINATES', payload: false });
                return;
            }

            console.log('✅ Creating point with coordinates from map click (standard flow)');
            dispatch({ type: 'SET_UI_MODE', payload: UI_MODE.CREATE_POINT });
            dispatch({ type: 'SET_POINT_TO_EDIT', payload: {
                id: `temp_point_${Date.now()}`,
                name: '',
                description: '',
                lat: coords[0],
                lon: coords[1],
                images: []
            }});
            dispatch({ type: 'SET_TEMP_POINT_COORDS', payload: coords });
            dispatch({ type: 'SET_WAITING_FOR_COORDINATES', payload: false });
        }
    }, [uiMode, waitingForCoordinates, currentRoute, routes.length]);

    const handleDragEndPoints = useCallback((newOrderedPoints) => {
        dispatch({ type: 'UPDATE_CURRENT_ROUTE_POINTS', payload: newOrderedPoints });
    }, []);

    const renderSidebarContent = () => {
        switch (uiMode) {
            case UI_MODE.MAIN_LIST:
                return (
                    <>
                        <div className="routes-header">
                            <div className="routes-title">Маршруты</div>
                            <AddRouteIcon className="add-route-btn" onClick={startCreateRoute} />
                        </div>
                        <div className="main-list-container">
                            <div className="routes-list" ref={routesListRef}>
                                <RoutesList
                                    onRouteHoverStart={handleRouteHoverStart}
                                    onRouteHoverEnd={handleRouteHoverEnd}
                                />
                            </div>
                            <CustomScrollbar
                                scrollableRef={routesListRef}
                                listLength={routes.length}
                                visibilityThreshold={5}
                            />
                        </div>
                    </>
                );
            case UI_MODE.CREATE_ROUTE:
            case UI_MODE.EDIT_ROUTE:
            case UI_MODE.VIEW_ROUTE_DETAILS:
                return (
                    <RouteCreationForm
                        route={currentRoute}
                        onSave={handleSaveRoute}
                        onCancel={showMainList}
                        onAddPointWithMapClick={startCreatePointWithMapClick}
                        onAddPointManual={startCreatePointManual}
                        onEditPoint={startEditPoint}
                        onDeletePoint={handleDeletePoint}
                        onDragEndPoints={handleDragEndPoints}
                        isViewMode={uiMode === UI_MODE.VIEW_ROUTE_DETAILS}
                        waitingForCoordinates={waitingForCoordinates}
                    />
                );
            case UI_MODE.CREATE_POINT:
            case UI_MODE.EDIT_POINT:
                return (
                    <PointCreationForm
                        point={pointToEdit}
                        tempCoords={tempPointCoords}
                        onSave={handleSavePoint}
                        onCancel={handleCancelPointForm}
                    />
                );
            default:
                return <div>Неизвестный режим UI.</div>;
        }
    };

    return (
        <RouteContext.Provider value={{
            routes,
            currentRoute,
            dispatch,
            startEditRoute,
            handleDeleteRoute,
            waitingForCoordinates,
            startViewRoute,
        }}>
            <div className="main-container">
                <div className="routes-container">
                    {renderSidebarContent()}
                </div>
                <div className="map-container">
                    <YandexMap
                        currentRoute={currentRoute}
                        previewRoute={previewRoute}
                        tempPointCoords={tempPointCoords}
                        uiMode={uiMode}
                        onMapClick={handleMapClickForPointCreation}
                        pointToEdit={pointToEdit}
                        onEditPoint={startEditPoint}
                        waitingForCoordinates={waitingForCoordinates}
                    />
                </div>
            </div>
        </RouteContext.Provider>
    );
}

export default App;
