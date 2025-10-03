import React, { useRef, useEffect, useContext, useCallback } from 'react';
import { RouteContext } from '../App';

const YANDEX_MAPS_API_KEY = '52c2e7b2-2008-4f6a-b445-d50dd722b668'; // Ваш API-ключ

const MapComponent = () => {
  const mapRef = useRef(null);
  const ymapsRef = useRef(null); // Для хранения объекта ymaps
  const myMapRef = useRef(null); // Для хранения экземпляра карты
  const routePlacemarksCollectionRef = useRef(null); // Коллекция для меток маршрута
  const routePolylineRef = useRef(null); // Линия маршрута
  const currentPlacemarkRef = useRef(null); // Временная красная метка

  const {
    currentRoute,
    isCreatingOrEditingRoute,
    isCreatingOrEditingPoint,
    pointToEdit,
    tempPointCoords,
    mapCenter,
    mapZoom,
    setMapCenter,
    setMapZoom,
    handleMapClickForPointCreation,
  } = useContext(RouteContext);

  // Загрузка скрипта Яндекс Карт
  useEffect(() => {
    if (!window.ymaps) {
      const script = document.createElement('script');
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${YANDEX_MAPS_API_KEY}&lang=ru_RU`;
      script.type = 'text/javascript';
      script.onload = () => {
        ymaps.ready(() => {
          ymapsRef.current = ymaps;
          initMap();
        });
      };
      document.head.appendChild(script);
    } else if (!myMapRef.current) {
      ymapsRef.current = window.ymaps;
      ymaps.ready(initMap);
    }

    return () => {
      // Очистка карты при размонтировании компонента
      if (myMapRef.current) {
        myMapRef.current.destroy();
        myMapRef.current = null;
      }
    };
  }, []);

  // Инициализация карты
  const initMap = useCallback(() => {
    if (ymapsRef.current && mapRef.current && !myMapRef.current) {
      myMapRef.current = new ymapsRef.current.Map(mapRef.current, {
        center: mapCenter,
        zoom: mapZoom,
        controls: ['zoomControl', 'fullscreenControl']
      }, {
        searchControlProvider: 'yandex#search',
        suppressMapOpenBlock: true,
      });

      routePlacemarksCollectionRef.current = new ymapsRef.current.GeoObjectCollection();
      myMapRef.current.geoObjects.add(routePlacemarksCollectionRef.current);

      myMapRef.current.events.add('click', (e) => {
        const coords = e.get('coords');
        // Запоминаем текущий центр карты, чтобы при возвращении он не сбрасывался на дефолтный
        setMapCenter(myMapRef.current.getCenter());
        setMapZoom(myMapRef.current.getZoom());
        handleMapClickForPointCreation(coords);
      });

      myMapRef.current.events.add('boundschange', (e) => {
        if (!e.get('tick')) {
            setMapCenter(myMapRef.current.getCenter());
            setMapZoom(myMapRef.current.getZoom());
        }
      });

      updateMapVisuals(); // Изначальная отрисовка
    }
  }, [mapCenter, mapZoom, setMapCenter, setMapZoom, handleMapClickForPointCreation]);

  // Обновление карты при изменении currentRoute, tempPointCoords или режима
  useEffect(() => {
    if (ymapsRef.current && myMapRef.current) {
      updateMapVisuals();
    }
  }, [currentRoute, tempPointCoords, isCreatingOrEditingRoute, isCreatingOrEditingPoint, pointToEdit, ymapsRef.current, myMapRef.current]);

  const updateMapVisuals = useCallback(() => {
    const ymaps = ymapsRef.current;
    const myMap = myMapRef.current;

    if (!ymaps || !myMap) return;

    // Очищаем все предыдущие метки и линии
    myMap.geoObjects.removeAll();
    routePlacemarksCollectionRef.current = new ymaps.GeoObjectCollection();
    myMap.geoObjects.add(routePlacemarksCollectionRef.current);
    routePolylineRef.current = null;
    currentPlacemarkRef.current = null;

    let pointsForPolyline = [];

    if (isCreatingOrEditingRoute && currentRoute && currentRoute.points.length > 0) {
      // Режим создания/редактирования маршрута
      currentRoute.points.forEach((pointData, index) => {
        const placemark = new ymaps.Placemark(
          [parseFloat(pointData.latitude), parseFloat(pointData.longitude)],
          { balloonContent: pointData.name, hintContent: pointData.description, iconContent: index + 1 },
          { preset: 'islands#greenDotIcon' }
        );
        routePlacemarksCollectionRef.current.add(placemark);
        pointsForPolyline.push([parseFloat(pointData.latitude), parseFloat(pointData.longitude)]);
      });

      if (pointsForPolyline.length > 1) {
        routePolylineRef.current = new ymaps.Polyline(pointsForPolyline, {}, {
          strokeColor: "#536C45",
          strokeWidth: 4,
          strokeOpacity: 0.8
        });
        myMap.geoObjects.add(routePolylineRef.current);
      }

      // Центрируем карту по маршруту
      if (routePlacemarksCollectionRef.current.getLength() > 0) {
        myMap.setBounds(routePlacemarksCollectionRef.current.getBounds(), { checkZoomRange: true, zoomMargin: 30 });
      }
    } else if (isCreatingOrEditingPoint && tempPointCoords) {
      // Режим создания точки (по клику на карту) - отображаем временную красную метку
      currentPlacemarkRef.current = new ymaps.Placemark(tempPointCoords, {}, {
        preset: 'islands#redDotIcon'
      });
      myMap.geoObjects.add(currentPlacemarkRef.current);
      myMap.setCenter(tempPointCoords, 14, { duration: 500 });
    } else if (isCreatingOrEditingPoint && pointToEdit) {
        // Режим редактирования существующей точки
        currentPlacemarkRef.current = new ymaps.Placemark(
            [parseFloat(pointToEdit.latitude), parseFloat(pointToEdit.longitude)],
            { balloonContent: pointToEdit.name, hintContent: pointToEdit.description },
            { preset: 'islands#redDotIcon' }
        );
        myMap.geoObjects.add(currentPlacemarkRef.current);
        myMap.setCenter([parseFloat(pointToEdit.latitude), parseFloat(pointToEdit.longitude)], 14, { duration: 500 });
    } else if (currentRoute && !isCreatingOrEditingRoute && !isCreatingOrEditingPoint) {
      // Режим просмотра маршрута (из списка)
      currentRoute.points.forEach((pointData, index) => {
        const placemark = new ymaps.Placemark(
          [parseFloat(pointData.latitude), parseFloat(pointData.longitude)],
          { balloonContent: pointData.name, hintContent: pointData.description, iconContent: index + 1 },
          { preset: 'islands#blueDotIcon' }
        );
        routePlacemarksCollectionRef.current.add(placemark);
        pointsForPolyline.push([parseFloat(pointData.latitude), parseFloat(pointData.longitude)]);
      });

      if (pointsForPolyline.length > 1) {
        routePolylineRef.current = new ymaps.Polyline(pointsForPolyline, {}, {
          strokeColor: "#0000FF",
          strokeWidth: 5,
          strokeOpacity: 0.7
        });
        myMap.geoObjects.add(routePolylineRef.current);
      }
      // Центрируем карту по маршруту
      if (routePlacemarksCollectionRef.current.getLength() > 0) {
        myMap.setBounds(routePlacemarksCollectionRef.current.getBounds(), { checkZoomRange: true, zoomMargin: 30 });
      }
    } else {
        // Изначальное состояние или сброс к пустым маршрутам
        myMap.setCenter(mapCenter, mapZoom);
    }

  }, [ymapsRef, myMapRef, currentRoute, isCreatingOrEditingRoute, isCreatingOrEditingPoint, pointToEdit, tempPointCoords, mapCenter, mapZoom]);

  // Синхронизация центра и зума карты с состоянием React
  useEffect(() => {
    if (myMapRef.current) {
      myMapRef.current.setCenter(mapCenter, mapZoom);
    }
  }, [mapCenter, mapZoom]);


  return <div id="map" ref={mapRef} style={{ width: '100%', height: '100%' }}></div>;
};

export default MapComponent;
