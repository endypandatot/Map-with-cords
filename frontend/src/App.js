import React, { useRef } from 'react';
import './style.css';
import { RouteProvider, useRouteContext } from './contexts/RouteContext';
import { UI_MODE } from './constants/uiModes';
import RoutesList from './components/RoutesList';
import RouteCreationForm from './components/RouteCreationForm';
import PointCreationForm from './components/PointCreationForm';
import YandexMap from './components/YandexMap';
import AddRouteIcon from './components/SvgIcons/AddRouteIcon';
import CustomScrollbar from './components/CustomScrollbar';

/**
 * Компонент содержимого приложения (внутри провайдера)
 */
function AppContent() {
    const routesListRef = useRef(null);

    // Получаем все необходимые данные и методы из контекста
    const {
        routes,
        currentRoute,
        previewRoute,
        pointToEdit,
        tempPointCoords,
        uiMode,
        waitingForCoordinates,

        // Обработчики маршрутов
        startCreateRoute,
        handleSaveRoute,
        showMainList,
        handleRouteHoverStart,
        handleRouteHoverEnd,

        // Обработчики точек
        startCreatePointWithMapClick,
        startCreatePointManual,
        startEditPoint,
        handleDeletePoint,
        handleCancelPointForm,
        handleSavePoint,
        handleDragEndPoints,

        // Обработчики карты
        handleMapClickForPointCreation,
    } = useRouteContext();

    /**
     * Рендер содержимого боковой панели в зависимости от режима UI
     */
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
                        onCancel={() => handleCancelPointForm(showMainList)}
                    />
                );

            default:
                return <div>Неизвестный режим UI.</div>;
        }
    };

    return (
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
    );
}

/**
 * Главный компонент приложения с провайдером
 */
function App() {
    return (
        <RouteProvider>
            <AppContent />
        </RouteProvider>
    );
}

export default App;

// Экспортируем UI_MODE для обратной совместимости с другими компонентами
export { UI_MODE } from './constants/uiModes';
export { RouteContext } from './contexts/RouteContext';
