import React from 'react';
import { API_BASE_URL } from '../api';

const PointsSectionItem = React.memo(({ point, index, onEditPoint }) => {

    const handleEdit = () => {
        onEditPoint(point, index);
    };

    // Обработка изображений
    const processedImages = (point.images || []).map(img => {
        if (typeof img === 'string') return img;
        if (typeof img === 'object' && img !== null && img.image) {
            return `${API_BASE_URL}${img.image}`;
        }
        return null;
    }).filter(Boolean);

    const formatCoord = (coord) => {
        const num = parseFloat(coord);
        return isNaN(num) ? '—' : num.toFixed(6);
    };

    return (
        <div className="points-section-item" onClick={handleEdit}>
            <div className="point-details-content">
                <div className="point-details-title">{point.name || 'Без названия'}</div>
                <div className="point-details-description">{point.description || 'Без описания'}</div>
                <div className="point-details-coords">
                    <div className="coord-item">
                        <span>Широта</span>
                        <span>{formatCoord(point.lat)}</span>
                    </div>
                    <div className="coord-item">
                        <span>Долгота</span>
                        <span>{formatCoord(point.lon)}</span>
                    </div>
                </div>
            </div>
            {processedImages.length > 0 && (
                <div className="point-details-images">
                    {processedImages.slice(0, 3).map((src, idx) => (
                        <img key={idx} src={src} alt="" />
                    ))}
                    {processedImages.length === 4 && (
                        <div className="more-images-overlay">
                            +1
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

export default PointsSectionItem;