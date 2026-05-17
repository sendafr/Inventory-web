from rest_framework import serializers
from .models import  TodoItem



class TodoItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = TodoItem
        fields = ['id', 'title', 'is_completed', 'due_date', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError("Todo title cannot be empty.")
        return value.strip()