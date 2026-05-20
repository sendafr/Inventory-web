from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
#from django.contrib.auth.models import User
#from django.db.models import Q
#from.serializers import UserRegisterSerializer, UserSerializer
#from records.serializers import CategorySerializer, InventoryItemSerializer

#from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer, UserSerializer, UserDetailSerializer, ChangePasswordSerializer
from inventory_api.settings import AUTH_USER_MODEL
import traceback
import logging

logger = logging.getLogger(__name__)


User = AUTH_USER_MODEL


# ─── Register ─────────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        # Auto-generate tokens on registration
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Account created successfully.',
            'data': {
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── Logout ────────────────────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'error': 'Refresh token is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response(
            {'message': 'Logged out successfully.'},
            status=status.HTTP_205_RESET_CONTENT
        )
    except Exception as err:
        return Response(
            {'error': 'Invalid or expired token.'},
            status=status.HTTP_400_BAD_REQUEST
        )

# ─── Change Password ──────────────────────────────────────────────────────────
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    serializer = ChangePasswordSerializer(
        data=request.data,
        context={'request': request}
    )
    if serializer.is_valid():
        serializer.update(request.user, serializer.validated_data)
        return Response(
            {'message': 'Password changed successfully.'},
            status=status.HTTP_200_OK
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ─── Profile View (Current User) ──────────────────────────────────
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([AllowAny])  # <--- Allow access without login for testing; change to IsAuthenticated in production
def profile_view(request):
    """Get, update, or delete current user profile"""
    try:
        if request.method == 'GET':
            serializer = UserDetailSerializer(request.user)
            return Response({'data': serializer.data}, status=status.HTTP_200_OK)
        
        elif request.method == 'PUT':
            serializer = UserDetailSerializer(
                request.user,
                data=request.data,
                partial=True
            )
            if serializer.is_valid():
                serializer.save()
                return Response({'data': serializer.data}, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        elif request.method == 'DELETE':
            request.user.delete()
            return Response(
                {'message': 'Account deleted'},
                status=status.HTTP_204_NO_CONTENT
            )
            
    except Exception as e:
        logger.error(f"Profile view error: {str(e)}", exc_info=True)
        return Response(
            {'detail': f'Error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ─── User List View (Admin Only) ──────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def user_list_view(request):
    """Get list of all users (admin only)"""
    try:
        users = User.objects.all().order_by('-created_at')
        serializer = UserDetailSerializer(users, many=True)
        return Response({'data': serializer.data}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"User list view error: {str(e)}", exc_info=True)
        return Response(
            {'detail': f'Error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ─── User Detail View (Admin Only) ────────────────────────────────
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def user_detail_view(request, pk):
    """Get, update, or delete a specific user (admin only)"""
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response(
            {'detail': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        if request.method == 'GET':
            serializer = UserDetailSerializer(user)
            return Response({'data': serializer.data}, status=status.HTTP_200_OK)
        
        elif request.method == 'PUT':
            serializer = UserDetailSerializer(
                user,
                data=request.data,
                partial=True
            )
            if serializer.is_valid():
                serializer.save()
                return Response({'data': serializer.data}, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        elif request.method == 'DELETE':
            user.delete()
            return Response(
                {'message': 'User deleted successfully'},
                status=status.HTTP_204_NO_CONTENT
            )
            
    except Exception as e:
        logger.error(f"User detail view error: {str(e)}", exc_info=True)
        return Response(
            {'detail': f'Error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ─── User Update View (Admin Only) ────────────────────────────────
@api_view(['PUT'])
@permission_classes([IsAuthenticated ])#IsAdminUser
def user_update_view(request, pk):
    """Update a specific user (admin only)"""
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response(
            {'detail': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        serializer = UserDetailSerializer(
            user,
            data=request.data,
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response({'data': serializer.data}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"User update view error: {str(e)}", exc_info=True)
        return Response(
            {'detail': f'Error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ─── User Delete View (Admin Only) ────────────────────────────────
@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def user_delete_view(request, pk):
    """Delete a specific user (admin only)"""
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response(
            {'detail': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    try:
        user.delete()
        return Response(
            {'message': 'User deleted successfully'},
            status=status.HTTP_204_NO_CONTENT
        )
    except Exception as e:
        logger.error(f"User delete view error: {str(e)}", exc_info=True)
        return Response(
            {'detail': f'Error: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

"""@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = UserRegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            "user": UserSerializer(user).data,
            "message": "User created successfully"
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

# Update existing views to require auth
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def item_list(request):
    if request.method == 'GET':
        items = InventoryItem.objects.select_related('category').all()
        
        category_id = request.query_params.get('category')
        if category_id:
            items = items.filter(category_id=category_id)
        
        search = request.query_params.get('search')
        if search:
            items = items.filter(Q(name__icontains=search) | Q(sku__icontains=search))
        
        low_stock = request.query_params.get('low_stock')
        if low_stock == 'true':
            items = items.filter(quantity__lte=models.F('reorder_level'))
        
        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(items, request)
        serializer = InventoryItemSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    elif request.method == 'POST':
        serializer = InventoryItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def item_detail(request, pk):

    item = get_object_or_404(InventoryItem, pk=pk)
    
    if request.method == 'GET':
        serializer = InventoryItemSerializer(item)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = InventoryItemSerializer(item, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def category_list(request):

    if request.method == 'GET':
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    #... same as before, just add the decoratorfrom django.shortcuts import render

"""
