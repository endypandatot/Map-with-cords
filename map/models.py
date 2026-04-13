from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
import os
import uuid
from django.db.models.signals import post_save
from django.dispatch import receiver

def point_image_upload_to(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('point_images', str(instance.point.id), filename)

class UserProfile(models.Model):
    SUBSCRIPTION_CHOICES = [
        ('free', 'Free'),
        ('premium', 'Premium'),
        ('max', 'Maximum'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    subscription_type = models.CharField(max_length=10, choices=SUBSCRIPTION_CHOICES, default='free')
    subscription_until = models.DateTimeField(default=timezone.now)

    def is_subscription_active(self):
        return self.subscription_until > timezone.now()

    def get_subscription_status(self):
        if not self.is_subscription_active():
            return 'free'
        return self.subscription_type

    def update_subscription_status(self):
        """Если подписка истекла и тип не free, сбрасываем на free"""
        if not self.is_subscription_active() and self.subscription_type != 'free':
            self.subscription_type = 'free'
            self.save(update_fields=['subscription_type'])

    def __str__(self):
        return f"{self.user.username} - {self.subscription_type}"

class Route(models.Model):
    name = models.CharField(max_length=200, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='routes', null=True, blank=True)

    def __str__(self):
        return self.name or f"Route {self.id}"

class Point(models.Model):
    route = models.ForeignKey(Route, related_name='points', on_delete=models.CASCADE)
    name = models.CharField(max_length=200, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    lat = models.DecimalField(max_digits=18, decimal_places=15, validators=[MinValueValidator(-90.0), MaxValueValidator(90.0)])
    lon = models.DecimalField(max_digits=18, decimal_places=15, validators=[MinValueValidator(-180.0), MaxValueValidator(180.0)])
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name or f"Point {self.id}"

class PointImage(models.Model):
    point = models.ForeignKey(Point, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to=point_image_upload_to)

    def __str__(self):
        return f"Image for {self.point.name}"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()