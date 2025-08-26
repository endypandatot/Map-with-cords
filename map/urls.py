from django.urls import path
from . import views


urlpatterns = [
    path('', views.map_view, name='yandex_map'),
    path('points/create/', views.create_point, name='point-create'),
    path('points/<int:pk>/upload/', views.upload_point_image, name='point-upload-image'),
]