from django.urls import path

from .views import CouponListCreateView, CouponDetailView, validate_coupon

urlpatterns = [
    path('stores/<int:store_id>/coupons/', CouponListCreateView.as_view(), name='coupon-list-create'),
    path('stores/<int:store_id>/coupons/<int:pk>/', CouponDetailView.as_view(), name='coupon-detail'),
    path('public/<slug:store_slug>/validate/', validate_coupon, name='coupon-validate'),
]
