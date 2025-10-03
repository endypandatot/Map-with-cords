from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse, HttpResponseBadRequest, JsonResponse
from django.views.decorators.http import require_POST
from PIL import Image
import json
from .models import Point, Route

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
