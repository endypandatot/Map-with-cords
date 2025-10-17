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
import { LIMITS, LIMIT_MESSAGES, checkLimits } from '../constants/limits';
import PointsSectionItem from './PointsSectionItem';
import AddPointIcon from './SvgIcons/AddPointIcon';

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
        if (!checkLimits.canAddPoint(points.length)) {
            alert(LIMIT_MESSAGES.MAX_POINTS);
            return;
        }
        onAddPointWithMapClick();
    };

    const handleAddPointManual = () => {
        if (!checkLimits.canAddPoint(points.length)) {
            alert(LIMIT_MESSAGES.MAX_POINTS);
            return;
        }
        onAddPointManual();
    };

    return (
        <div className="points-section">
            <div className="points-section-header">
                <label>Точки маршрута ({points.length}/{LIMITS.MAX_POINTS_PER_ROUTE})</label>
                {!isViewMode && (
                    <div className="add-point-buttons">
                        <button
                            className={`add-point-btn ${waitingForCoordinates ? 'waiting' : ''}`}
                            onClick={handleAddPointWithMapClick}
                            disabled={!checkLimits.canAddPoint(points.length)}
                            title={
                                waitingForCoordinates
                                    ? 'Кликните на карту'
                                    : !checkLimits.canAddPoint(points.length)
                                    ? LIMIT_MESSAGES.MAX_POINTS
                                    : 'Добавить точку через карту'
                            }
                        >
                            <AddPointIcon className="add-icon" />
                            {waitingForCoordinates ? 'Кликните на карту' : 'Добавить по карте'}
                        </button>
                        <button
                            className="add-point-manual-btn"
                            onClick={handleAddPointManual}
                            disabled={!checkLimits.canAddPoint(points.length)}
                            title={
                                !checkLimits.canAddPoint(points.length)
                                    ? LIMIT_MESSAGES.MAX_POINTS
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
