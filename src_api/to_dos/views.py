from django.shortcuts import render

# Create your views here.
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated,AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import  TodoItem
from .serializers import  TodoItemSerializer



@api_view(['GET'])
@permission_classes([AllowAny])
def get_todo(request):
    todos = TodoItem.objects.all().order_by('-created_at')
    serializer = TodoItemSerializer(todos, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
def todo_create(request):

    serializer = TodoItemSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([AllowAny]) # Only authenticated users can update/delete todos
def delete_todo(request, pk):
    try:
        todo = TodoItem.objects.get(pk=pk)
        todo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except TodoItem.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

@api_view(['PUT'])
@permission_classes([AllowAny]) # Only authenticated users can update/delete todos
def todo_detail(request, pk):
    """
    PUT: Update a specific todo (e.g., toggle completion)."""
  
    
    try:
        todo = TodoItem.objects.get(pk=pk)
    except TodoItem.DoesNotExist:
        return Response({'error': 'Todo not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PUT':
        serializer = TodoItemSerializer(todo, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    
