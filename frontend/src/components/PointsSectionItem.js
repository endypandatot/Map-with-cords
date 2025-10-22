import React, { useMemo } from 'react';
import { processImages } from '../utils/imageHelpers';

const PointsSectionItem = React.memo(({ point, index, onEditPoint }) => {

    const handleEdit = () => {
        onEditPoint(point, index);
    };

    // Используем централизованную обработку изображений
    const processedImages = useMemo(() => {
        console.log(' PointsSectionItem processing images for:', point.name);
        console.log(' Raw images:', point.images);
        const processed = processImages(point.images || []);
        console.log(' Processed images:', processed);
        return processed;
    }, [point.images, point.name]);

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
                        <img
                            key={idx}
                            src={src}
                            alt=""
                            onError={(e) => {
                                console.error('❌ Image load error:', src);
                                e.target.style.display = 'none';
                            }}
                        />
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
