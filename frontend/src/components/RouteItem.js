import React, { useState, useContext, useCallback } from 'react';
import { RouteContext } from '../App';
import DeleteIcon from './SvgIcons/DeleteIcon';
import EditIcon from './SvgIcons/EditIcon';
import PhotoIcon from './SvgIcons/PhotoIcon';
import ArrowDownIcon from './SvgIcons/ArrowDownIcon';
import { API_BASE_URL } from '../api';

const RouteListPointItem = React.memo(({ point, index }) => {

    // Обработка изображений
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
        <div className="route-point">
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
        </div>
    );
});

const RouteItem = ({ routeData, onHoverStart, onHoverEnd }) => {
    const { startEditRoute, handleDeleteRoute, startViewRoute } = useContext(RouteContext);
    const [pointsListVisible, setPointsListVisible] = useState(false);

    const handleSelectRoute = useCallback(() => {
        console.log('🎯 Route selected for viewing:', routeData);
        startViewRoute(routeData.id);
    }, [startViewRoute, routeData]);

    const handleEdit = useCallback((e) => {
        e.stopPropagation();
        startEditRoute(routeData.id);
    }, [startEditRoute, routeData.id]);

    const handleDelete = useCallback((e) => {
        e.stopPropagation();
        handleDeleteRoute(routeData.id);
    }, [handleDeleteRoute, routeData.id]);

    const togglePointsList = useCallback((e) => {
        e.stopPropagation();
        setPointsListVisible(prev => !prev);
    }, []);

    const handleMouseEnter = useCallback(() => {
        if (onHoverStart) {
            onHoverStart(routeData.id);
        }
    }, [onHoverStart, routeData.id]);

    const handleMouseLeave = useCallback(() => {
        if (onHoverEnd) {
            onHoverEnd();
        }
    }, [onHoverEnd]);

    const hasPhotos = routeData.points.some(p => p.images && p.images.length > 0);

    return (
        <div
            className="route-item"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="route-item-content">
                <div className="route-title-wrapper">
                    <div className="route-title-container" onClick={handleSelectRoute}>
                        <div className="route-title">{routeData.name || 'Без названия'}</div>
                        {hasPhotos && <PhotoIcon className="photo-icon" />}
                    </div>
                    <div className="route-actions">
                        <span onClick={handleEdit}><EditIcon className="route-action-btn edit-btn" /></span>
                        <span onClick={handleDelete}><DeleteIcon className="route-action-btn delete-btn" /></span>
                    </div>
                </div>
                <div className="route-description">{routeData.description || 'Без описания'}</div>
                <div className="route-points-wrapper" onClick={togglePointsList}>
                    <span>{routeData.points.length} точки</span>
                    <ArrowDownIcon className={pointsListVisible ? 'active' : ''} />
                </div>
                <div className={`route-points-list ${pointsListVisible ? 'visible' : ''}`}>
                    {routeData.points.map((point, index) => (
                        <RouteListPointItem key={point.id || index} point={point} index={index} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RouteItem;