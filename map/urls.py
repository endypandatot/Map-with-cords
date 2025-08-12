from django.urls import path
from . import views

urlpatterns = [
    path('', views.map_view, name='yandex_map'),
]