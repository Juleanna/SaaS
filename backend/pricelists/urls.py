from django.urls import path
from . import views

app_name = 'pricelists'

urlpatterns = [
    # API для управління прайс-листами
    path('api/stores/<int:store_id>/pricelists/', 
         views.PriceListListCreateView.as_view(), 
         name='pricelist-list-create'),
    
    path('api/stores/<int:store_id>/pricelists/<uuid:pk>/', 
         views.PriceListDetailView.as_view(), 
         name='pricelist-detail'),
    
    # API для управління позиціями прайс-листів
    path('api/stores/<int:store_id>/pricelists/<uuid:pricelist_id>/items/', 
         views.PriceListItemListCreateView.as_view(), 
         name='pricelist-item-list-create'),
    
    path('api/stores/<int:store_id>/pricelists/<uuid:pricelist_id>/items/<uuid:pk>/', 
         views.PriceListItemDetailView.as_view(), 
         name='pricelist-item-detail'),
    
    # API для масових оновлень цін
    path('api/stores/<int:store_id>/pricelists/<uuid:pricelist_id>/bulk-updates/', 
         views.BulkPriceUpdateListCreateView.as_view(), 
         name='bulk-update-list-create'),
    
    path('api/stores/<int:store_id>/pricelists/<uuid:pricelist_id>/bulk-updates/<uuid:bulk_update_id>/execute/', 
         views.execute_bulk_update, 
         name='execute-bulk-update'),
    
    # API для історії зміни цін
    path('api/stores/<int:store_id>/pricelists/<uuid:pricelist_id>/history/', 
         views.PriceHistoryListView.as_view(), 
         name='price-history-list'),
    
    # Додаткові операції
    path('api/stores/<int:store_id>/pricelists/<uuid:pricelist_id>/sync-costs/', 
         views.sync_costs_from_warehouse, 
         name='sync-costs-from-warehouse'),
    
    path('api/stores/<int:store_id>/pricelists/<uuid:pricelist_id>/analytics/', 
         views.pricelist_analytics, 
         name='pricelist-analytics'),
    
    path('api/stores/<int:store_id>/pricelists/<uuid:pricelist_id>/copy/', 
         views.copy_pricelist, 
         name='copy-pricelist'),
]