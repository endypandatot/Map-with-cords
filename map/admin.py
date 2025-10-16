from django.contrib import admin
# map/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import Route, Point, PointImage


class PointImageInline(admin.TabularInline):
    """Инлайн-редактор для изображений точек"""
    model = PointImage
    extra = 1
    max_num = 4
    fields = ('image', 'image_preview')
    readonly_fields = ('image_preview',)

    def image_preview(self, obj):
        """Предпросмотр изображения"""
        if obj.image:
            return format_html(
                '<img src="{}" style="max-width: 100px; max-height: 100px;" />',
                obj.image.url
            )
        return "Нет изображения"

    image_preview.short_description = 'Предпросмотр'


class PointInline(admin.TabularInline):
    """Инлайн-редактор для точек маршрута"""
    model = Point
    extra = 1
    max_num = 20
    fields = ('name', 'lat', 'lon', 'order', 'description')
    ordering = ('order',)


@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    """Админка для маршрутов"""
    list_display = ('id', 'name', 'points_count', 'created_at', 'updated_at')
    list_display_links = ('id', 'name')
    search_fields = ('name', 'description')
    list_filter = ('created_at', 'updated_at')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)

    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'description')
        }),
        ('Системная информация', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ('created_at', 'updated_at')
    inlines = [PointInline]

    def points_count(self, obj):
        """Количество точек в маршруте"""
        return obj.points.count()

    points_count.short_description = 'Количество точек'

    def save_model(self, request, obj, form, change):
        """Переопределение сохранения для валидации"""
        if obj.name and len(obj.name) > 200:
            from django.contrib import messages
            messages.error(request, 'Название не должно превышать 200 символов')
            return
        if obj.description and len(obj.description) > 1000:
            from django.contrib import messages
            messages.error(request, 'Описание не должно превышать 1000 символов')
            return
        super().save_model(request, obj, form, change)


@admin.register(Point)
class PointAdmin(admin.ModelAdmin):
    """Админка для точек"""
    list_display = ('id', 'name', 'route', 'lat', 'lon', 'order', 'images_count')
    list_display_links = ('id', 'name')
    list_filter = ('route',)
    search_fields = ('name', 'description', 'route__name')
    ordering = ('route', 'order')

    fieldsets = (
        ('Привязка к маршруту', {
            'fields': ('route', 'order')
        }),
        ('Информация о точке', {
            'fields': ('name', 'description')
        }),
        ('Координаты', {
            'fields': ('lat', 'lon')
        }),
    )

    inlines = [PointImageInline]

    def images_count(self, obj):
        """Количество изображений у точки"""
        count = obj.images.count()
        if count > 0:
            return format_html(
                '<span style="color: green; font-weight: bold;">{}</span>',
                count
            )
        return format_html('<span style="color: gray;">0</span>')

    images_count.short_description = 'Изображений'

    def save_model(self, request, obj, form, change):
        """Переопределение сохранения для валидации"""
        if obj.name and len(obj.name) > 200:
            from django.contrib import messages
            messages.error(request, 'Название не должно превышать 200 символов')
            return
        if obj.description and len(obj.description) > 1000:
            from django.contrib import messages
            messages.error(request, 'Описание не должно превышать 1000 символов')
            return
        if not (-90 <= float(obj.lat) <= 90):
            from django.contrib import messages
            messages.error(request, 'Широта должна быть в диапазоне от -90 до 90')
            return
        if not (-180 <= float(obj.lon) <= 180):
            from django.contrib import messages
            messages.error(request, 'Долгота должна быть в диапазоне от -180 до 180')
            return
        super().save_model(request, obj, form, change)


@admin.register(PointImage)
class PointImageAdmin(admin.ModelAdmin):
    """Админка для изображений точек"""
    list_display = ('id', 'point', 'image_preview', 'image')
    list_display_links = ('id',)
    list_filter = ('point__route',)
    search_fields = ('point__name', 'point__route__name')

    fields = ('point', 'image', 'image_preview')
    readonly_fields = ('image_preview',)

    def image_preview(self, obj):
        """Предпросмотр изображения"""
        if obj.image:
            return format_html(
                '<img src="{}" style="max-width: 200px; max-height: 200px; border-radius: 8px;" />',
                obj.image.url
            )
        return "Нет изображения"

    image_preview.short_description = 'Предпросмотр'

    def has_add_permission(self, request):
        """Ограничение добавления через отдельную админку"""
        return True

    def save_model(self, request, obj, form, change):
        """Валидация при сохранении"""
        if obj.point.images.count() >= 4 and not change:
            from django.contrib import messages
            messages.error(request, 'У точки не может быть больше 4 изображений')
            return
        super().save_model(request, obj, form, change)


admin.site.site_header = 'Админ-панель: Управление маршрутами'
admin.site.site_title = 'Маршруты - Админ'
admin.site.index_title = 'Управление маршрутами и точками'

