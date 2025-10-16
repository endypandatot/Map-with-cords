// src/components/RouteItem.js
import React, { useState, useContext } from 'react';
import { RouteContext } from '../App';
import { API_BASE_URL } from '../api';
import EditIcon from './SvgIcons/EditIcon';
import DeleteIcon from './SvgIcons/DeleteIcon';
import PhotoIcon from './SvgIcons/PhotoIcon';
import ArrowDownIcon from './SvgIcons/ArrowDownIcon';

const RouteItem = ({ route, onMouseEnter, onMouseLeave }) => {
    const { startEditRoute, handleDeleteRoute, startViewRoute } = useContext(RouteContext);
    const [showPoints, setShowPoints] = useState(false);

    // Обработка изображений
    const processedPoints = route.points?.map(point => ({
        ...point,
        images: (point.images || []).map(img => {
            if (typeof img === 'string') return img;
            if (typeof img === 'object' && img !== null && img.image) {
                return `${API_BASE_URL}${img.image}`;
            }
            return null;
        }).filter(Boolean)
    })) || [];

    // Проверяем есть ли хоть одно изображение в маршруте
    const hasAnyImages = processedPoints.some(point => point.images && point.images.length > 0);

    const handleEdit = (e) => {
        e.stopPropagation();
        startEditRoute(route.id);
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        handleDeleteRoute(route.id);
    };

    const handleView = (e) => {
        // Если кликнули на кнопки действий, не открываем просмотр
        if (e.target.closest('.route-action-btn')) return;
        // Если кликнули на стрелку точек, не открываем просмотр
        if (e.target.closest('.route-points-wrapper')) return;
        startViewRoute(route.id);
    };

    const togglePoints = (e) => {
        e.stopPropagation();
        setShowPoints(!showPoints);
    };

    return (
        <div
            className="route-item"
            onMouseEnter={() => onMouseEnter(route.id)}
            onMouseLeave={onMouseLeave}
            onClick={handleView}
        >
            <div className="route-item-content">
                {/* Заголовок с названием и действиями */}
                <div className="route-title-wrapper">
                    <div className="route-title-container">
                        <div className="route-title">{route.name || 'Без названия'}</div>
                        {hasAnyImages && (
                            <PhotoIcon className="photo-icon" />
                        )}
                    </div>
                    <div className="route-actions">
                        <EditIcon className="route-action-btn" onClick={handleEdit} />
                        <DeleteIcon className="route-action-btn" onClick={handleDelete} />
                    </div>
                </div>

                {/* Описание */}
                {route.description && (
                    <div className="route-description">{route.description}</div>
                )}

                {/* Точки маршрута (сворачиваемые) */}
                {processedPoints.length > 0 && (
                    <div className="route-points-wrapper" onClick={togglePoints}>
                        <ArrowDownIcon className={showPoints ? 'active' : ''} />
                        <span>{processedPoints.length} точки</span>
                    </div>
                )}

                {/* Список точек (показывается при раскрытии) */}
                <div className={`route-points-list ${showPoints ? 'visible' : ''}`}>
                    {processedPoints.map((point, index) => (
                        <div key={point.id || index} className="route-point">
                            <div className="route-point-icon">
                                <div className="dot dot-1"></div>
                                <div className="dot dot-2"></div>
                                <div className="dot dot-3"></div>
                                <div className="dot dot-4"></div>
                                <div className="dot dot-5"></div>
                                <div className="dot dot-6"></div>
                            </div>
                            <div className="route-point-content">
                                <div className="route-point-name">{point.name || 'Без названия'}</div>
                                {point.images && point.images.length > 0 && (
                                    <div className="route-point-images-inline">
                                        <div className="image-container">
                                            {point.images.slice(0, 3).map((src, idx) => (
                                                <img key={idx} src={src} alt="" />
                                            ))}
                                        </div>
                                        {point.images.length > 3 && (
                                            <div className="image-count">+{point.images.length - 3}</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RouteItem;