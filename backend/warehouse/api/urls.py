from django.urls import path
from . import views

urlpatterns = [
    # Основні warehouse endpoints (для сумісності з фронтендом)
    path('warehouses/', views.WarehouseListView.as_view(), name='warehouse-list'),
    path('stocks/', views.StockListView.as_view(), name='stock-list'),
    path('suppliers/', views.SupplierListView.as_view(), name='supplier-list'),
    path('supplies/', views.SupplyListView.as_view(), name='supply-list'),
    path('inventories/', views.InventoryListView.as_view(), name='inventory-list'),
    
    # API для інвентаризації зі сканером
    path('inventory/<int:inventory_id>/scan/', views.scan_product_for_inventory, name='scan_product_for_inventory'),
    path('inventory/<int:inventory_id>/scan/bulk/', views.bulk_scan_products, name='bulk_scan_products'),
    path('inventory/<int:inventory_id>/scan/summary/', views.inventory_scan_summary, name='inventory_scan_summary'),
]