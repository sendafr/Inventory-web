from django.shortcuts import render

# Create your views here.
# persio_acc/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Transaction
from .serializers import TransactionSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import permission_classes

@api_view(['GET'])
@permission_classes([AllowAny])  # Allow any user to access this view
def get_transactions(request):
    transactions = Transaction.objects.all().order_by('-date')
    serializer = TransactionSerializer(transactions, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])  # Allow any user to access this view
def create_transaction(request):
    serializer = TransactionSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([AllowAny])  # Allow any user to access this view
def delete_transaction(request, pk):
    try:
        transaction = Transaction.objects.get(pk=pk)
        transaction.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Transaction.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)