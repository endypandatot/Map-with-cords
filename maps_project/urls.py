from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from map.api_views import RouteViewSet, PointViewSet

router = DefaultRouter()
router.register(r'routes', RouteViewSet)
router.register(r'points', PointViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),

    # API для маршрутов и точек (DRF)
    path('api/', include(router.urls)),

    # Все остальные пути (карта, создание точек, авторизация) – подключаем из map.urls
    path('', include('map.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)