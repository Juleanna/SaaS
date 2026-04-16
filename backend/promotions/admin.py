from django.contrib import admin

from .models import Coupon


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'store', 'discount_type', 'discount_value', 'uses_count', 'is_active', 'valid_until')
    list_filter = ('discount_type', 'is_active', 'store')
    search_fields = ('code', 'description')
    readonly_fields = ('uses_count', 'created_at', 'updated_at')
