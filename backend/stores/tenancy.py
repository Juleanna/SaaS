from __future__ import annotations

from django.http import Http404
from django.utils.functional import cached_property

from stores.models import Store


class StoreScopedMixin:
    """
    Базовый миксин для DRF-вью, который:
    - вытаскивает текущий магазин из kwargs/заголовка/StoreContextMiddleware;
    - жёстко фильтрует queryset по магазину;
    - прокидывает store в serializer context и perform_create.
    """

    store_kwarg = "store_id"
    store_slug_kwarg = "store_slug"
    require_owner = True
    allow_inactive_store = False

    @cached_property
    def store(self) -> Store:
        # Приоритет: middleware → slug → id
        store_from_request = getattr(self.request, "store", None)
        if store_from_request:
            store = store_from_request
        else:
            slug = self.kwargs.get(self.store_slug_kwarg)
            store_id = self.kwargs.get(self.store_kwarg)
            qs = Store.objects.all()
            if not self.allow_inactive_store:
                qs = qs.filter(is_active=True)

            store = None
            if slug:
                store = qs.filter(slug=slug).first()
            elif store_id:
                store = qs.filter(id=store_id).first()

            if not store:
                raise Http404("Store not found")

            self.request.store = store
            self.request.store_slug = store.slug
            self.request.store_id = store.id

        if self.require_owner and getattr(self.request, "user", None):
            user = self.request.user
            if not (user.is_superuser or user.is_staff) and store.owner_id != user.id:
                raise Http404("Store not found")

        return store

    def filter_queryset_by_store(self, queryset, field_name="store"):
        return queryset.filter(**{field_name: self.store})

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["store"] = self.store
        return context

    def perform_create(self, serializer):
        store_field = getattr(serializer.Meta, "store_field", "store")
        if store_field in serializer.fields:
            serializer.save(**{store_field: self.store})
        elif "store" in serializer.fields:
            serializer.save(store=self.store)
        else:
            serializer.save()
