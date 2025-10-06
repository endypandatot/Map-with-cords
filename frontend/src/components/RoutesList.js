import React, { useContext } from 'react';
import { RouteContext } from '../App';
import RouteItem from './RouteItem';

function RoutesList({ onRouteHoverStart, onRouteHoverEnd }) {
    const { routes } = useContext(RouteContext);

    return (
        <>
            {routes.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    Маршрутов пока нет. Добавьте первый маршрут!
                </div>
            ) : (
                routes.map(route => (
                    <RouteItem
                        key={route.id}
                        routeData={route}
                        onHoverStart={onRouteHoverStart}
                        onHoverEnd={onRouteHoverEnd}
                    />
                ))
            )}
        </>
    );
}

export default RoutesList;