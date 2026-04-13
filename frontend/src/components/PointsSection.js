import React from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { LIMITS, LIMIT_MESSAGES } from '../constants/limits';
import PointsSectionItem from './PointsSectionItem';
import AddPointIcon from './SvgIcons/AddPointIcon';
import { useAuth } from '../contexts/AuthContext';  // добавлено

console.log('PointsSection.js loaded!');

function PointsSection({
    points,
    onAddPointWithMapClick,
    onAddPointManual,
    onEditPoint,
    onDeletePoint,
    onDragEnd,
    isViewMode,
    waitingForCoordinates
}) {
    const { profile } = useAuth();  // добавлено
    const maxPointsPerRoute = profile?.max_points_per_route || LIMITS.MAX_POINTS_PER_ROUTE;  // добавлено

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const oldIndex = points.findIndex((point) =>
                String(point.id || `point-${points.indexOf(point)}`) === String(active.id)
            );
            const newIndex = points.findIndex((point) =>
                String(point.id || `point-${points.indexOf(point)}`) === String(over.id)
            );

            const newPoints = arrayMove(points, oldIndex, newIndex);
            console.log('Points reordered:', newPoints);
            onDragEnd(newPoints);
        }
    };

    const handleAddPointWithMapClick = () => {
        if (points.length >= maxPointsPerRoute) {   // изменено
            alert(`Достигнут лимит точек в маршруте (${maxPointsPerRoute}). Обновите подписку.`);
            return;
        }
        onAddPointWithMapClick();
    };

    const handleAddPointManual = () => {
        if (points.length >= maxPointsPerRoute) {   // изменено
            alert(`Достигнут лимит точек в маршруте (${maxPointsPerRoute}). Обновите подписку.`);
            return;
        }
        onAddPointManual();
    };

    return (
        <div className="points-section">
            <div className="points-section-header">
                <label>Точки маршрута ({points.length}/{maxPointsPerRoute})</label>   {/* изменено */}
                {!isViewMode && (
                    <div className="add-point-buttons">
                        <button
                            className={`add-point-btn ${waitingForCoordinates ? 'waiting' : ''}`}
                            onClick={handleAddPointWithMapClick}
                            disabled={points.length >= maxPointsPerRoute}
                            title={
                                waitingForCoordinates
                                    ? 'Кликните на карту'
                                    : points.length >= maxPointsPerRoute
                                    ? `Лимит точек (${maxPointsPerRoute}) достигнут`
                                    : 'Добавить точку через карту'
                            }
                        >
                            <AddPointIcon className="add-icon" />
                            {waitingForCoordinates ? 'Кликните на карту' : 'Добавить по карте'}
                        </button>
                        <button
                            className="add-point-manual-btn"
                            onClick={handleAddPointManual}
                            disabled={points.length >= maxPointsPerRoute}
                            title={
                                points.length >= maxPointsPerRoute
                                    ? `Лимит точек (${maxPointsPerRoute}) достигнут`
                                    : 'Добавить точку вручную'
                            }
                        >
                            Добавить вручную
                        </button>
                    </div>
                )}
            </div>

            <div className="points-list">
                {points.length === 0 ? (
                    <div className="no-points">
                        {isViewMode ? 'Нет точек в маршруте' : 'Добавьте точки в маршрут'}
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={points.map((point, index) =>
                                String(point.id || `point-${index}`)
                            )}
                            strategy={verticalListSortingStrategy}
                            disabled={isViewMode}
                        >
                            {points.map((point, index) => (
                                <PointsSectionItem
                                    key={point.id || `point-${index}`}
                                    id={String(point.id || `point-${index}`)}
                                    point={point}
                                    index={index}
                                    onEdit={onEditPoint}
                                    onDelete={onDeletePoint}
                                    isViewMode={isViewMode}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                )}
            </div>
        </div>
    );
}

export default PointsSection;