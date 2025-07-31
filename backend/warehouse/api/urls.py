from django.urls import path
from . import views

urlpatterns = [
    # API для інвентаризації зі сканером
    path('inventory/<int:inventory_id>/scan/', views.scan_product_for_inventory, name='scan_product_for_inventory'),
    path('inventory/<int:inventory_id>/scan/bulk/', views.bulk_scan_products, name='bulk_scan_products'),
    path('inventory/<int:inventory_id>/scan/summary/', views.inventory_scan_summary, name='inventory_scan_summary'),
]