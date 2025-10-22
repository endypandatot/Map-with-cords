from rest_framework import serializers
from django.db import transaction
from decimal import Decimal, InvalidOperation
from .models import Route, Point, PointImage
from .image_validation import (
    is_valid_image_extension,
    is_valid_mime_type,
    is_valid_image_size,
    get_allowed_formats_string,
    MAX_IMAGE_SIZE_MB,
    ALLOWED_MIME_TYPES
)


class PointImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PointImage
        fields = ['id', 'image']
        read_only_fields = ['id']

    def validate_image(self, value):
        """Валидация изображения с использованием единых констант"""
        # Проверка размера файла
        if not is_valid_image_size(value.size):
            raise serializers.ValidationError(
                f'Размер файла не должен превышать {MAX_IMAGE_SIZE_MB} МБ. '
                f'Текущий размер: {value.size / (1024 * 1024):.2f} МБ'
            )

        # Проверка расширения файла
        if not is_valid_image_extension(value.name):
            raise serializers.ValidationError(
                f'Недопустимое расширение файла. Разрешены: {get_allowed_formats_string()}'
            )

        # Проверка MIME-типа
        if not is_valid_mime_type(value.content_type):
            raise serializers.ValidationError(
                f'Недопустимый тип файла: {value.content_type}. '
                f'Разрешены: {", ".join(ALLOWED_MIME_TYPES)}'
            )

        return value


class PointSerializer(serializers.ModelSerializer):
    images = PointImageSerializer(many=True, read_only=True)

    class Meta:
        model = Point
        fields = ['id', 'name', 'description', 'lat', 'lon', 'images', 'order']
        read_only_fields = ['id', 'order', 'images']

    def validate_name(self, value):
        """Валидация названия точки"""
        if value:
            value = value.strip()
            if len(value) > 200:
                raise serializers.ValidationError('Название точки не должно превышать 200 символов')
        return value

    def validate_description(self, value):
        """Валидация описания точки"""
        if value:
            value = value.strip()
            if len(value) > 1000:
                raise serializers.ValidationError('Описание точки не должно превышать 1000 символов')
        return value

    def validate_lat(self, value):
        """Валидация широты"""
        try:
            lat = Decimal(str(value))
            if lat < -90 or lat > 90:
                raise serializers.ValidationError('Широта должна быть в диапазоне от -90 до 90')
            return lat
        except (InvalidOperation, ValueError, TypeError):
            raise serializers.ValidationError('Некорректное значение широты')

    def validate_lon(self, value):
        """Валидация долготы"""
        try:
            lon = Decimal(str(value))
            if lon < -180 or lon > 180:
                raise serializers.ValidationError('Долгота должна быть в диапазоне от -180 до 180')
            return lon
        except (InvalidOperation, ValueError, TypeError):
            raise serializers.ValidationError('Некорректное значение долготы')

    def validate(self, data):
        """Общая валидация данных точки"""
        # защита read_only полей от изменения
        if self.instance:  # При обновлении
            # Проверяем, что пользователь не пытается изменить read_only поля
            request_data = self.context.get('request').data if self.context.get('request') else {}

            if 'id' in request_data and request_data['id'] != self.instance.id:
                raise serializers.ValidationError({
                    'id': 'Нельзя изменить ID точки'
                })

            if 'order' in request_data and request_data['order'] != self.instance.order:
                raise serializers.ValidationError({
                    'order': 'Порядок точек управляется автоматически'
                })

        return data


class RouteSerializer(serializers.ModelSerializer):
    points = PointSerializer(many=True, read_only=True)

    class Meta:
        model = Route
        fields = ['id', 'name', 'description', 'points', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'points']

    def validate_name(self, value):
        """Валидация названия маршрута"""
        if value:
            value = value.strip()
            if len(value) > 200:
                raise serializers.ValidationError('Название маршрута не должно превышать 200 символов')
        return value

    def validate_description(self, value):
        """Валидация описания маршрута"""
        if value:
            value = value.strip()
            if len(value) > 1000:
                raise serializers.ValidationError('Описание маршрута не должно превышать 1000 символов')
        return value

    def validate(self, data):
        """Общая валидация данных маршрута"""
        # защита read_only полей от изменения
        if self.instance:  # При обновлении
            request_data = self.context.get('request').data if self.context.get('request') else {}

            if 'id' in request_data and request_data['id'] != self.instance.id:
                raise serializers.ValidationError({
                    'id': 'Нельзя изменить ID маршрута'
                })

            if 'created_at' in request_data:
                raise serializers.ValidationError({
                    'created_at': 'Дата создания не может быть изменена'
                })

            if 'updated_at' in request_data:
                raise serializers.ValidationError({
                    'updated_at': 'Дата обновления управляется автоматически'
                })

        return data

    @transaction.atomic
    def create(self, validated_data):
        """Создание маршрута с точками"""
        points_data = self.initial_data.get('points', [])

        # Проверка лимита на количество точек
        MAX_POINTS = 20
        if len(points_data) > MAX_POINTS:
            raise serializers.ValidationError({
                'points': f'Максимальное количество точек в маршруте: {MAX_POINTS}'
            })

        route = Route.objects.create(**validated_data)

        for idx, point_data in enumerate(points_data):
            # Фильтруем только разрешенные поля
            allowed_fields = {'name', 'description', 'lat', 'lon'}
            filtered_point_data = {k: v for k, v in point_data.items() if k in allowed_fields}

            point_serializer = PointSerializer(data=filtered_point_data, context=self.context)
            point_serializer.is_valid(raise_exception=True)
            point_serializer.save(route=route, order=idx)

        return route

    @transaction.atomic
    def update(self, instance, validated_data):
        """Обновление маршрута с точками"""
        points_data = self.initial_data.get('points', None)

        # Обновляем основную информацию о маршруте
        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        instance.save()

        if points_data is not None:
            # Проверка лимита на количество точек
            MAX_POINTS = 20
            if len(points_data) > MAX_POINTS:
                raise serializers.ValidationError({
                    'points': f'Максимальное количество точек в маршруте: {MAX_POINTS}'
                })

            # Сохраняем существующие точки с изображениями
            existing_points_map = {point.id: point for point in instance.points.all()}
            updated_point_ids = []

            for idx, point_data in enumerate(points_data):
                point_id = point_data.get('id')

                # Фильтруем только разрешенные поля
                allowed_fields = {'name', 'description', 'lat', 'lon'}
                filtered_point_data = {k: v for k, v in point_data.items() if k in allowed_fields}

                if point_id and isinstance(point_id, int) and point_id in existing_points_map:
                    # Обновляем существующую точку
                    existing_point = existing_points_map[point_id]
                    existing_point.name = filtered_point_data.get('name', existing_point.name)
                    existing_point.description = filtered_point_data.get('description', existing_point.description)
                    existing_point.lat = filtered_point_data.get('lat', existing_point.lat)
                    existing_point.lon = filtered_point_data.get('lon', existing_point.lon)
                    existing_point.order = idx
                    existing_point.save()
                    updated_point_ids.append(point_id)
                else:
                    # Создаем новую точку
                    point_serializer = PointSerializer(data=filtered_point_data, context=self.context)
                    point_serializer.is_valid(raise_exception=True)
                    new_point = point_serializer.save(route=instance, order=idx)
                    updated_point_ids.append(new_point.id)

            # Удаляем точки, которые больше не присутствуют в маршруте
            points_to_delete = instance.points.exclude(id__in=updated_point_ids)
            for point in points_to_delete:
                # Удаляем связанные изображения
                point.images.all().delete()
                point.delete()

        return instance
