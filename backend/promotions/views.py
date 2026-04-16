from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from stores.models import Store
from stores.tenancy import StoreScopedMixin
from stores.permissions import IsStoreOwnerOrStaff

from .models import Coupon
from .serializers import CouponSerializer, CouponValidateSerializer


class CouponListCreateView(StoreScopedMixin, generics.ListCreateAPIView):
    """CRUD промокодів для магазину."""

    serializer_class = CouponSerializer
    permission_classes = [permissions.IsAuthenticated, IsStoreOwnerOrStaff]

    def get_queryset(self):
        return Coupon.objects.filter(store=self.store)

    def perform_create(self, serializer):
        serializer.save(store=self.store)


class CouponDetailView(StoreScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CouponSerializer
    permission_classes = [permissions.IsAuthenticated, IsStoreOwnerOrStaff]

    def get_queryset(self):
        return self.filter_queryset_by_store(Coupon.objects.all())


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def validate_coupon(request, store_slug):
    """Публічна перевірка промокоду (для сторінки магазину/checkout)."""
    store = get_object_or_404(Store, slug=store_slug, is_active=True)
    serializer = CouponValidateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    code = serializer.validated_data['code'].strip()
    order_amount = serializer.validated_data['order_amount']

    try:
        coupon = Coupon.objects.get(store=store, code__iexact=code)
    except Coupon.DoesNotExist:
        return Response({'valid': False, 'error': 'Промокод не знайдено'}, status=status.HTTP_404_NOT_FOUND)

    ok, reason = coupon.is_valid(order_amount=order_amount)
    if not ok:
        return Response({'valid': False, 'error': reason}, status=status.HTTP_400_BAD_REQUEST)

    discount = coupon.calculate_discount(order_amount)
    return Response({
        'valid': True,
        'code': coupon.code,
        'discount_type': coupon.discount_type,
        'discount_value': str(coupon.discount_value),
        'discount_amount': str(discount),
        'final_amount': str(max(0, order_amount - discount)),
    })
