from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse, HttpResponseBadRequest, JsonResponse
from django.views.decorators.http import require_POST
from PIL import Image
import json
from .models import Point, Route
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.middleware.csrf import get_token
from .models import UserProfile
from .serializers import UserProfileSerializer
from .subscription_limits import get_max_routes, get_max_points_per_route
from django.utils import timezone
from datetime import timedelta

def map_view(request):
    points = Point.objects.all()
    return render(request, 'map_template.html', {'points': points})

@require_POST
def create_point(request):
    try:
        data = json.loads(request.body.decode('utf-8'))
        lat = float(data.get('lat'))
        lon = float(data.get('lon'))
    except Exception:
        return HttpResponseBadRequest('Invalid payload')

    # Сохраняем точку в БД
    p = Point.objects.create(lat=lat, lon=lon)
    return HttpResponse(str(p.pk))

@require_POST
def upload_point_image(request, pk):
    point = get_object_or_404(Point, pk=pk)
    uploaded = request.FILES.get('file')
    if not uploaded:
        return HttpResponseBadRequest('No file uploaded')
    if uploaded.size > 5 * 1024 * 1024:
        return HttpResponseBadRequest('File too large')
    try:
        img = Image.open(uploaded)
        img.verify()
    except Exception:
        return HttpResponseBadRequest('Invalid image')
    point.image.save(uploaded.name, uploaded, save=True)
    return HttpResponse(point.image.url)


@api_view(['GET'])
def get_csrf_token(request):
    return Response({'csrfToken': get_token(request)})

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    password2 = request.data.get('password2')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')

    if not username or not email or not password:
        return Response({'error': 'Все поля обязательны'}, status=status.HTTP_400_BAD_REQUEST)
    if password != password2:
        return Response({'error': 'Пароли не совпадают'}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(username=username).exists():
        return Response({'error': 'Пользователь с таким именем уже существует'}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(email=email).exists():
        return Response({'error': 'Пользователь с такой почтой уже существует'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, email=email, password=password)
    user.first_name = first_name
    user.last_name = last_name
    user.save()
    login(request, user)
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        return Response({'id': user.id, 'username': user.username, 'email': user.email})
    else:
        return Response({'error': 'Неверные учетные данные'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response({'message': 'Вы вышли'})

@api_view(['GET'])
@permission_classes([AllowAny])
def user_view(request):
    if request.user.is_authenticated:
        return Response({
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name
        })
    else:
        return Response(None, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    profile = request.user.profile
    profile.update_subscription_status()
    serializer = UserProfileSerializer(profile)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_subscription(request):
    subscription_type = request.data.get('subscription_type')
    test_mode = request.data.get('test_mode', False)  # новый параметр

    if subscription_type not in ['free', 'premium', 'max']:
        return Response({'error': 'Неверный тип подписки'}, status=400)

    profile = request.user.profile
    if subscription_type == 'free':
        profile.subscription_type = 'free'
        profile.subscription_until = timezone.now()
    else:
        profile.subscription_type = subscription_type
        if test_mode:
            # Тестовый режим: 15 секунд
            profile.subscription_until = timezone.now() + timedelta(seconds=15)
        else:
            # Обычный режим: 30 дней
            profile.subscription_until = timezone.now() + timedelta(days=30)
    profile.save()
    return Response({
        'status': 'ok',
        'subscription_type': profile.subscription_type,
        'subscription_until': profile.subscription_until
    })