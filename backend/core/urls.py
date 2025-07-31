from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from core.admin import dashboard_view

urlpatterns = [
    path('admin/dashboard/', dashboard_view, name='admin_dashboard'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/stores/', include('stores.urls')),
    path('api/products/', include('products.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/telegram/', include('telegram_bot.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT) 