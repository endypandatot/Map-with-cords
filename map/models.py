# map/models.py
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
import os
import uuid

def point_image_upload_to(instance, filename):
    ext = filename.split('.')[-1]
    # Сохраняем в папку с ID точки для порядка
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('point_images', str(instance.point.id), filename)

class Route(models.Model):
    name = models.CharField(max_length=200, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name or f"Route {self.id}"

class Point(models.Model):
    route = models.ForeignKey(Route, related_name='points', on_delete=models.CASCADE)
    name = models.CharField(max_length=200, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    lat = models.DecimalField(max_digits=18, decimal_places=15, validators=[MinValueValidator(-90.0), MaxValueValidator(90.0)])
    lon = models.DecimalField(max_digits=18, decimal_places=15, validators=[MinValueValidator(-180.0), MaxValueValidator(180.0)])
    order = models.IntegerField(default=0)
    # --- ИЗМЕНЕНИЕ ---
    # Убираем старые поля 'image' и 'images', они больше не нужны.

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name or f"Point {self.id}"

# --- НОВАЯ МОДЕЛЬ ---
class PointImage(models.Model):
    """
    Модель для хранения одного изображения, связанного с точкой.
    """
    point = models.ForeignKey(Point, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to=point_image_upload_to)

    def __str__(self):
        return f"Image for {self.point.name}"
