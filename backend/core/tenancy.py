from __future__ import annotations

from django.utils.deprecation import MiddlewareMixin
from stores.models import Store


class StoreContextMiddleware(MiddlewareMixin):
    """
    Заполняет request.store/request.store_slug/request.store_id на основе пути или заголовка.

    Приоритет:
    1) kwargs из resolver (store_slug/store_id)
    2) заголовок X-Store-Slug (для API вызовов со стороны витрины)
    """

    header_slug_meta_key = "HTTP_X_STORE_SLUG"

    def process_request(self, request):
        request.store = None
        request.store_slug = None
        request.store_id = None

    def process_view(self, request, view_func, view_args, view_kwargs):
        slug = None
        store_id = None
        if view_kwargs:
            slug = view_kwargs.get("store_slug")
            store_id = view_kwargs.get("store_id")

        if not slug:
            slug = request.META.get(self.header_slug_meta_key)

        if not slug and not store_id:
            return None

        qs = Store.objects.all()
        store = None

        if slug:
            store = qs.filter(slug=slug).first()
        elif store_id:
            store = qs.filter(id=store_id).first()

        if store:
            request.store = store
            request.store_slug = store.slug
            request.store_id = store.id
        else:
            request.store_slug = slug
            request.store_id = store_id

        return None
