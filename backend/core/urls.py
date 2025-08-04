from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from core.admin import dashboard_view
from core import feature_flags_views
from core.views import dashboard_stats

urlpatterns = [
    path('admin/dashboard/', dashboard_view, name='admin_dashboard'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/stores/', include('stores.urls')),
    path('api/products/', include('products.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/pricelists/', include('pricelists.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/warehouse/', include('warehouse.api.urls')),
    path('api/telegram/', include('telegram_bot.urls')),
    
    # Feature Flags API
    path('api/feature-flags/user/', feature_flags_views.get_user_feature_flags, name='user-feature-flags'),
    path('api/feature-flags/store/<int:store_id>/', feature_flags_views.get_store_feature_flags, name='store-feature-flags'),
    path('api/feature-flags/check/', feature_flags_views.check_feature_flag, name='check-feature-flag'),
    
    # Admin Feature Flags API
    path('api/admin/feature-flags/enable/', feature_flags_views.admin_enable_flag, name='admin-enable-flag'),
    path('api/admin/feature-flags/disable/', feature_flags_views.admin_disable_flag, name='admin-disable-flag'),
    path('api/admin/feature-flags/clear-cache/', feature_flags_views.admin_clear_flag_cache, name='admin-clear-flag-cache'),
    
    # Dashboard API
    path('api/dashboard/stats/', dashboard_stats, name='dashboard-stats'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT) 