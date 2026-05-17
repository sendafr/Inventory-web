from rest_framework import serializers
from .models import Budget

class BudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Budget
        fields = ['id', 'category', 'limit_amount', 'period', 'created_at']
        read_only_fields = ['id', 'created_at'] # User shouldn't set these manually

    def validate_limit_amount(self, value):
        if value < 0:
            raise serializers.ValidationError("Budget limit cannot be negative.")
        return value
