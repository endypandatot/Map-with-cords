from django.urls import path
from . import views

urlpatterns = [
    # Главная страница с картой
    path('', views.map_view, name='map_view'),

    # Старые эндпоинты (для обратной совместимости)
    path('create_point/', views.create_point, name='create_point'),
    path('upload_point_image/<int:pk>/', views.upload_point_image, name='upload_point_image'),

    # НОВЫЕ ЭНДПОИНТЫ АВТОРИЗАЦИИ (без префикса api/)
    path('api/register/', views.register, name='register'),
    path('api/login/', views.login_view, name='login'),
    path('api/logout/', views.logout_view, name='logout'),
    path('api/user/', views.user_view, name='user'),
    path('api/csrf/', views.get_csrf_token, name='csrf'),
    path('api/profile/', views.profile_view, name='profile'),
    path('api/change-subscription/', views.change_subscription, name='change_subscription'),
]