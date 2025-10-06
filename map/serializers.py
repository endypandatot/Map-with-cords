from rest_framework import serializers
from django.db import transaction
from .models import Route, Point, PointImage


class PointImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PointImage
        fields = ['id', 'image']


class PointSerializer(serializers.ModelSerializer):
    images = PointImageSerializer(many=True, read_only=True)

    class Meta:
        model = Point
        fields = ['id', 'name', 'description', 'lat', 'lon', 'images', 'order']
        read_only_fields = ['id', 'order']


class RouteSerializer(serializers.ModelSerializer):
    points = PointSerializer(many=True, read_only=True)

    class Meta:
        model = Route
        fields = ['id', 'name', 'description', 'points', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

    @transaction.atomic
    def create(self, validated_data):
        points_data = self.initial_data.get('points', [])
        route = Route.objects.create(**validated_data)

        for idx, point_data in enumerate(points_data):
            point_serializer = PointSerializer(data=point_data)
            point_serializer.is_valid(raise_exception=True)
            point_serializer.save(route=route, order=idx)

        return route

    @transaction.atomic
    def update(self, instance, validated_data):
        points_data = self.initial_data.get('points', None)

        # Обновляем основную информацию о маршруте
        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        instance.save()

        if points_data is not None:
            existing_points_map = {point.id: point for point in instance.points.all()}
            updated_point_ids = []

            for idx, point_data in enumerate(points_data):
                point_id = point_data.get('id')

                if point_id and isinstance(point_id, int) and point_id in existing_points_map:
                    # Обновляем существующую точку, сохраняя её изображения
                    existing_point = existing_points_map[point_id]
                    existing_point.name = point_data.get('name', existing_point.name)
                    existing_point.description = point_data.get('description', existing_point.description)
                    existing_point.lat = point_data.get('lat', existing_point.lat)
                    existing_point.lon = point_data.get('lon', existing_point.lon)
                    existing_point.order = idx
                    existing_point.save()
                    updated_point_ids.append(point_id)
                else:
                    # Создаем новую точку
                    point_serializer = PointSerializer(data=point_data)
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