from django.shortcuts import render

# Create your views here.
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import Budget

from .serializers import BudgetSerializer



@api_view(['GET'])
@permission_classes([AllowAny]) # Only authenticated users can access budgets
def budget_list(request):
    budgets = Budget.objects.all().order_by('-created_at')
    serializer = BudgetSerializer(budgets, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny]) # Only authenticated users can create budgets
def budget_create(request):
    serializer = BudgetSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
def delete_budget(request, pk):
    try:
        budget = Budget.objects.get(pk=pk)
        budget.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Budget.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

@api_view(['PUT'])
@permission_classes([AllowAny]) # Only authenticated users can update budgets
def budget_detail(request, pk):
    
    """PUT: Update a specific budget."""
    #DELETE: Delete a specific budget.

    try:
        budget = Budget.objects.get(pk=pk)
    except Budget.DoesNotExist:
        return Response({'error': 'Budget not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PUT':
        serializer = BudgetSerializer(budget, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# --- Budget Views ---

"""@api_view(['GET', 'POST'])
# Assuming you handle auth via JWT tokens in headers
@permission_classes([AllowAny]) # Only authenticated users can access budgets
def budget_list_create(request):
    
    GET: List all budgets for the logged-in user.
    POST: Create a new budget for the logged-in user.
    
    if request.method == 'GET':
        budgets = Budget.objects.filter(user=request.user)
        serializer = BudgetSerializer(budgets, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = BudgetSerializer(data=request.data)
        if serializer.is_valid():
            # Automatically assign the logged-in user
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT', 'DELETE'])
@permission_classes([AllowAny]) # Only authenticated users can update/delete budgets
def budget_detail(request, pk):
    
    PUT: Update a specific budget.
    DELETE: Delete a specific budget.

    try:
        budget = Budget.objects.get(pk=pk, user=request.user)
    except Budget.DoesNotExist:
        return Response({'error': 'Budget not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PUT':
        serializer = BudgetSerializer(budget, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        budget.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
"""