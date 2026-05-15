from django.urls import path
from . import views

urlpatterns = [
    path('item_list/', views.item_list, name='item_list'),
    path('item_detail/<int:pk>/', views.item_detail, name='item_detail'),
    path('category_list/', views.category_list, name='category_list'),
    path('inventory_bulk_update/', views.inventory_bulk_update, name='inventory_bulk_update'),

]