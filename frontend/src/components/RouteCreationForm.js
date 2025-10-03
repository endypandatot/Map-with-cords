// src/components/RouteCreationForm.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import SaveIcon from './SvgIcons/SaveIcon';
import CancelIcon from './SvgIcons/CancelIcon';
import PointDeleteIcon from './SvgIcons/PointDeleteIcon';
import PointsSectionItem from './PointsSectionItem';
import CustomScrollbar from './CustomScrollbar';
import { API_BASE_URL } from '../api';

const FormRoutePointItem = React.memo(({ point, index, isViewMode, onEdit, onDelete, onDragStart, onDragOver, onDragLeave, onDrop, isDragging, dragOverPosition }) => {
    const pointRef = useRef(null);
    const handleDragStart = useCallback((e) => { if (!isViewMode && onDragStart) { onDragStart(e, index); } }, [isViewMode, onDragStart, index]);
    const handleDragOver = useCallback((e) => { if (!isViewMode && onDragOver) { onDragOver(e, index); } }, [isViewMode, onDragOver, index]);
    const handleDragLeave = useCallback((e) => { if (!isViewMode && onDragLeave) { onDragLeave(e, index); } }, [isViewMode, onDragLeave, index]);
    const handleDrop = useCallback((e) => { if (!isViewMode && onDrop) { onDrop(e, index); } }, [isViewMode, onDrop, index]);
    const className = `route-point ${isDragging ? 'dragging' : ''} ${dragOverPosition ? `drag-over-${dragOverPosition}` : ''}`;

    const processedImages = (point.images || []).map(img => {
        if (typeof img === 'string') {
            return img;
        }
        if (typeof img === 'object' && img !== null && img.image) {
            return `${API_BASE_URL}${img.image}`;
        }
        return null;
    }).filter(Boolean);

    const visibleImages = processedImages.slice(0, 3);
    const remainingImagesCount = processedImages.length - visibleImages.length;

    return (
        <div
            className={className}
            draggable={!isViewMode}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            ref={pointRef}
            onClick={() => !isViewMode && onEdit(point, index)}
        >
            <div className="route-point-icon">
                <div className="dot dot-1"></div><div className="dot dot-2"></div><div className="dot dot-3"></div>
                <div className="dot dot-4"></div><div className="dot dot-5"></div><div className="dot dot-6"></div>
            </div>
            <div className="route-point-content">
                <div className="route-point-name">{point.name || `Точка ${index + 1}`}</div>
                {processedImages.length > 0 && (
                    <div className="route-point-images-inline">
                        <div className="image-container">
                            {visibleImages.map((src, idx) => (
                                <img key={idx} src={src} alt="" />
                            ))}
                        </div>
                        {remainingImagesCount > 0 && (
                            <div className="image-count">+{remainingImagesCount}</div>
                        )}
                    </div>
                )}
            </div>
            {!isViewMode && (<PointDeleteIcon onClick={(e) => { e.stopPropagation(); onDelete(point.id); }} />)}
        </div>
    );
});

function RouteCreationForm({ route: initialRoute, onSave, onCancel, onAddPoint, onEditPoint, onDeletePoint, onDragEndPoints, isViewMode = false, waitingForCoordinates = false }) {
    const [routeName, setRouteName] = useState('');
    const [routeDescription, setRouteDescription] = useState('');
    const [routePoints, setRoutePoints] = useState([]);
    const [isSaveEnabled, setIsSaveEnabled] = useState(false);
    const [draggedItemIndex, setDraggedItemIndex] = useState(null);
    const [dragOverItemIndex, setDragOverItemIndex] = useState(null);
    const [dragOverPosition, setDragOverPosition] = useState(null);

    const shortListRef = useRef(null);
    const detailedListRef = useRef(null);

    useEffect(() => {
        if (initialRoute) {
            setRouteName(initialRoute.name || '');
            setRouteDescription(initialRoute.description || '');
            setRoutePoints(initialRoute.points || []);
        }
    }, [initialRoute]);

    useEffect(() => {
        const hasPoints = routePoints.length > 0;
        const nameOrDescFilled = routeName.trim() !== '' || routeDescription.trim() !== '';
        setIsSaveEnabled(hasPoints || nameOrDescFilled);
    }, [routeName, routeDescription, routePoints]);

    const handleSave = useCallback(() => {
        const routeToSave = { ...initialRoute, name: routeName.trim() || 'Без названия', description: routeDescription.trim() || 'Без описания', points: routePoints };
        onSave(routeToSave);
    }, [initialRoute, routeName, routeDescription, routePoints, onSave]);

    const handleAddPoint = () => onAddPoint();
    const handleEditPoint = (point, index) => onEditPoint(point, index);
    const handleDeletePoint = useCallback((pointId) => { if (window.confirm('Вы уверены, что хотите удалить эту точку?')) { onDeletePoint(pointId); } }, [onDeletePoint]);

    const handleDragStart = useCallback((e, index) => { setDraggedItemIndex(index); e.dataTransfer.effectAllowed = 'move'; }, []);
    const handleDragOver = useCallback((e, index) => { e.preventDefault(); if (draggedItemIndex === null || draggedItemIndex === index) return; setDragOverItemIndex(index); const rect = e.currentTarget.getBoundingClientRect(); const offset = rect.y + rect.height / 2; setDragOverPosition(e.clientY < offset ? 'top' : 'bottom'); }, [draggedItemIndex]);
    const handleDragLeave = useCallback(() => { setDragOverItemIndex(null); setDragOverPosition(null); }, []);
    const handleDrop = useCallback((e, dropIndex) => { e.preventDefault(); if (draggedItemIndex === null) return; const newRoutePoints = [...routePoints]; const [movedItem] = newRoutePoints.splice(draggedItemIndex, 1); newRoutePoints.splice(dropIndex, 0, movedItem); onDragEndPoints(newRoutePoints); setDraggedItemIndex(null); setDragOverItemIndex(null); setDragOverPosition(null); }, [draggedItemIndex, routePoints, onDragEndPoints]);

    if (!initialRoute) return null;

    return (
        <div className="form-container">
            <div className="form-header">
                <div className="routes-title">
                    {isViewMode ? 'Просмотр маршрута' : (initialRoute.id && typeof initialRoute.id === 'number' ? 'Редактирование маршрута' : 'Создание маршрута')}
                </div>
                <div className="route-form-actions">
                    {!isViewMode && (<SaveIcon onClick={handleSave} disabled={!isSaveEnabled} />)}
                    <CancelIcon onClick={onCancel} />
                </div>
            </div>
            <input type="text" placeholder="Введите название маршрута" value={routeName} onChange={(e) => setRouteName(e.target.value)} readOnly={isViewMode} />
            <textarea placeholder="Краткое описание" value={routeDescription} onChange={(e) => setRouteDescription(e.target.value)} readOnly={isViewMode}></textarea>
            <div className="scrollable-list-container">
                <div className="route-points-list visible" ref={shortListRef}>
                    {routePoints.map((point, index) => (
                        <FormRoutePointItem key={point.id || `temp-${index}`} point={point} index={index} isViewMode={isViewMode} onEdit={handleEditPoint} onDelete={handleDeletePoint} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} isDragging={draggedItemIndex === index} dragOverPosition={dragOverItemIndex === index ? dragOverPosition : null} />
                    ))}
                </div>
                <CustomScrollbar scrollableRef={shortListRef} listLength={routePoints.length} visibilityThreshold={5} />
            </div>
            <div className="list-footer">
                <span className="points-counter-bottom">{routePoints.length} точек</span>
                {!isViewMode && (
                    <button
                        className={`add-route-point-btn-text ${waitingForCoordinates ? 'waiting' : ''}`}
                        onClick={handleAddPoint}
                        disabled={waitingForCoordinates}
                    >
                        {waitingForCoordinates ? 'Кликните на карту...' : 'Добавить точку'}
                    </button>
                )}
            </div>
            <div className="points-section-header">
                <h3>Точки</h3>
                {!isViewMode && (
                    <div
                        className={`points-section-add-btn ${waitingForCoordinates ? 'waiting' : ''}`}
                        onClick={!waitingForCoordinates ? handleAddPoint : undefined}
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 3V13" stroke="white" strokeWidth="2" strokeLinecap="round" />
                            <path d="M3 8H13" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                )}
            </div>
            <div className="scrollable-list-container">
                <div className="points-section" ref={detailedListRef}>
                    {routePoints.map((point, index) => (
                        <PointsSectionItem key={point.id || `point-sec-${index}`} point={point} index={index} onEditPoint={handleEditPoint} />
                    ))}
                </div>
                 <CustomScrollbar scrollableRef={detailedListRef} listLength={routePoints.length} visibilityThreshold={4} />
            </div>
        </div>
    );
}

export default RouteCreationForm;