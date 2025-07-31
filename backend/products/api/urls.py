from django.urls import path
from . import views

urlpatterns = [
    # Пошук товарів по кодах
    path('search/barcode/', views.search_by_barcode, name='search_by_barcode'),
    path('search/qr/', views.search_by_qr_code, name='search_by_qr_code'),
    path('search/code/', views.search_by_code, name='search_by_code'),
    
    # Генерація кодів
    path('<int:product_id>/generate-barcode/', views.generate_barcode, name='generate_barcode'),
    path('<int:product_id>/generate-qr/', views.generate_qr_code, name='generate_qr_code'),
]