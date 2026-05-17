from django.urls import path
from . import views

app_name = 'budgets'

urlpatterns = [
    # Budget Endpoints
    path('budget_list/', views.budget_list, name='budget-list'), # GET all budgets, POST create budget
    path('budget_create/', views.budget_create, name='budget-create'), # POST create budget
    path('budget_detail/<int:pk>/', views.budget_detail, name='budget-detail'), # PUT update budget, DELETE budget

]