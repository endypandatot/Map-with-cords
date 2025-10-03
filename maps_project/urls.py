from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from map import views
from rest_framework.routers import DefaultRouter
from map.api_views import RouteViewSet, PointViewSet

router = DefaultRouter()
router.register(r'routes', RouteViewSet)
router.register(r'points', PointViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),

    # Существующие пути
    path('', views.map_view, name='map_view'),
    path('create_point/', views.create_point, name='create_point'),
    path('upload_point_image/<int:pk>/', views.upload_point_image, name='upload_point_image'),

    # Новые пути для REST API
    path('api/', include(router.urls)),
]

# Добавьте это для работы с медиафайлами в режиме разработки
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
