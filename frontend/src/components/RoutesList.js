import React, { useContext } from 'react';
import { RouteContext } from '../contexts/RouteContext';
import RouteItem from './RouteItem';

function RoutesList({ onRouteHoverStart, onRouteHoverEnd }) {
    const { routes } = useContext(RouteContext);

    if (!routes || routes.length === 0) {
        return (
            <div style={{
                padding: '20px',
                textAlign: 'center',
                color: 'rgba(48, 55, 45, 0.40)',
                fontSize: '14px'
            }}>
                Нет созданных маршрутов
            </div>
        );
    }

    return (
        <>
            {routes.map(route => (
                <RouteItem
                    key={route.id}
                    route={route}
                    onMouseEnter={onRouteHoverStart}
                    onMouseLeave={onRouteHoverEnd}
                />
            ))}
        </>
    );
}

export default RoutesList;