from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from. import views

from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    # Auth
    path('register/', views.register_view, name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', views.logout_view, name='logout'),

    # Profile
    #path('profile/', views.profile_view, name='profile'),
    path('change-password/', views.change_password_view, name='change_password'),
    
    # Profile endpoints (current user)
    path('profile/', views.profile_view, name='user-profile'),
    
    # User management endpoints (admin only)
    path('user-list/', views.user_list_view, name='user-list'),  # GET all users
    path('<int:pk>/', views.user_detail_view, name='user-detail'),  # GET, PUT, DELETE specific user
    path('<int:pk>/update/', views.user_update_view, name='user-update'),  # PUT specific user
]






"""
urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', views.current_user, name='current-user'),
    path('items/', views.item_list, name='item-list'),
    path('items/<int:pk>/', views.item_detail, name='item-detail'),
    path('categories/', views.category_list, name='category-list'),
    
]"""