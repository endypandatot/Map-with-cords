from django.db import models

def point_image_upload_to(instance, filename):
    # сохранение в media/points/<pk>/<filename>
    return f'points/{instance.pk}/{filename}'

class Point(models.Model):
    objects = models.Manager()
    name = models.CharField(max_length=200, blank=True)
    lat = models.FloatField()
    lon = models.FloatField()
    image = models.ImageField(upload_to=point_image_upload_to, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name or f'Point {self.pk}'
