"""
Sitemap для публічних магазинів і товарів. Допомагає SEO.
"""
from django.contrib.sitemaps import Sitemap
from django.urls import reverse

from stores.models import Store
from products.models import Product


class StoreSitemap(Sitemap):
    changefreq = 'daily'
    priority = 0.8
    protocol = 'https'

    def items(self):
        return Store.objects.filter(is_active=True)

    def location(self, obj):
        return f'/store/{obj.slug}'

    def lastmod(self, obj):
        return obj.updated_at


class ProductSitemap(Sitemap):
    changefreq = 'daily'
    priority = 0.6
    protocol = 'https'
    limit = 5000

    def items(self):
        return Product.objects.filter(is_active=True, store__is_active=True).select_related('store')

    def location(self, obj):
        return f'/store/{obj.store.slug}/product/{obj.slug}'

    def lastmod(self, obj):
        return obj.updated_at


sitemaps = {
    'stores': StoreSitemap,
    'products': ProductSitemap,
}
