# accounts/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('transactions/', views.get_transactions, name='get_transactions'),
    path('transactions/create/', views.create_transaction, name='create_transaction'),
    path('transactions/delete/<int:pk>/', views.delete_transaction, name='delete_transaction'),
]