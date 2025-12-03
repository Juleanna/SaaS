from django.shortcuts import get_object_or_404
from rest_framework.permissions import BasePermission, SAFE_METHODS

from stores.models import Store


class IsStoreOwnerOrStaff(BasePermission):
    """
    Доступ только владельцу магазина либо staff/superuser.
    Опираться на request.store (middleware/mixin) или slug/id из kwargs.
    """

    message = "Доступ разрешён только владельцу магазина или администратору"

    def _resolve_store(self, request, view):
        if hasattr(request, "store") and request.store:
            return request.store
        slug = view.kwargs.get("store_slug")
        store_id = view.kwargs.get("store_id")
        qs = Store.objects.all()
        if slug:
            return get_object_or_404(qs, slug=slug)
        if store_id:
            return get_object_or_404(qs, id=store_id)
        return None

    def has_permission(self, request, view):
        store = self._resolve_store(request, view)
        if not store:
            return False
        if request.user.is_superuser or request.user.is_staff:
            return True
        return store.owner_id == getattr(request.user, "id", None)

    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)
