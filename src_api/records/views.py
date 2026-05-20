from django.shortcuts import render

# Create your views here.
from rest_framework.decorators import api_view, permission_classes  # Add this
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Category, InventoryItem
from .serializers import CategorySerializer, InventoryItemSerializer
from rest_framework.permissions import AllowAny  # Add this
from django.db.models import Q

from django.db import transaction

from .utils import safe_eval_formula

@api_view(['POST'])
@permission_classes([AllowAny])  # <--- FIX 1: Allows access without login
def inventory_bulk_update(request):
    data = request.data

    if not isinstance(data, list):
        return Response({'error': 'Expected a list of items'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        with transaction.atomic():
            saved_items = []
            errors = []

            for idx, item in enumerate(data):
                sku = item.get('sku')
                if not sku:
                    continue

                # Build context for formula eval
                context = {
                    'quantity': float(item.get('quantity') or 0),
                    'cost_price': float(item.get('cost_price') or 0),
                    'selling_price': float(item.get('selling_price') or 0),
                    'reorder_level': float(item.get('reorder_level') or 0),
                }

                # Recalculate fields with formulas
                for field in ['quantity', 'cost_price', 'selling_price', 'reorder_level']:
                    formula = item.get(f'{field}_formula')
                    if formula:
                        try:
                            calculated = safe_eval_formula(formula, context)
                            item[field] = calculated
                            # Update context so later formulas see the new value
                            context[field] = calculated
                        except ValueError as e:
                            errors.append({'row': idx, 'sku': sku, 'field': field, 'error': str(e)})
                            # Keep old value if formula is invalid
                            item[f'{field}_formula'] = None

                # upsert
                obj, created = InventoryItem.objects.update_or_create(
                    sku=sku,
                    defaults=item
                )
                saved_items.append(obj)

            if errors:
                return Response({
                    'saved': InventoryItemSerializer(saved_items, many=True).data,
                    'errors': errors
                }, status=status.HTTP_207_MULTI_STATUS)

            serializer = InventoryItemSerializer(saved_items, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])  # <--- FIX 1: Allows access without login
def item_list(request):
    if request.method == 'GET':
        items = InventoryItem.objects.select_related('category').all()
        
        # Filter by category
        category_id = request.query_params.get('category')
        if category_id:
            items = items.filter(category_id=category_id)
        
        # Search by name or SKU
        search = request.query_params.get('search')
        if search:
            items = items.filter(
                Q(name__icontains=search) | Q(sku__icontains=search)
            )
        
        # Filter low stock only
        low_stock = request.query_params.get('low_stock')
        if low_stock == 'true':
            items = [item for item in items if item.is_low_stock]
        
        # Serialize data
        serializer = InventoryItemSerializer(items, many=True)
        
        # FIX 2: Wrap data to match what React expects (count + results)
        return Response({
            "count": items.count(),
            "results": serializer.data
        })
    
    elif request.method == 'POST':
        serializer = InventoryItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

"""
@api_view(['GET', 'POST'])
def item_list(request):
    if request.method == 'GET':
        items = InventoryItem.objects.select_related('category').all()
        
        # Filter by category
        category_id = request.query_params.get('category')
        if category_id:
            items = items.filter(category_id=category_id)
        
        # Search by name or SKU
        search = request.query_params.get('search')
        if search:
            items = items.filter(
                Q(name__icontains=search) | Q(sku__icontains=search)
            )
        
        # Filter low stock only
        low_stock = request.query_params.get('low_stock')
        if low_stock == 'true':
            items = [item for item in items if item.is_low_stock]
        
        serializer = InventoryItemSerializer(items, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = InventoryItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

"""#... rest of views stay the same

"""@api_view(['GET', 'POST'])
def item_list(request):
    if request.method == 'GET':
        items = InventoryItem.objects.select_related('category').all()
        category_id = request.query_params.get('category')
        if category_id:
            items = items.filter(category_id=category_id)
        serializer = InventoryItemSerializer(items, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = InventoryItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
"""
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([AllowAny])  # <--- FIX 1: Allows access without login
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
@permission_classes([AllowAny])  # <--- FIX 1: Allows access without login
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