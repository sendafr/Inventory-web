from rest_framework import serializers
from .models import Category, InventoryItem



class CategorySerializer(serializers.ModelSerializer):
    item_count = serializers.IntegerField(source='inventory_items.count', read_only=True)
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'item_count', 'created_at']

class InventoryItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    class Meta:
        model = InventoryItem
        fields = [
            'id', 'sku', 'name', 'category_name',
            'quantity', 'quantity_formula',
            'cost_price', 'cost_price_formula',
            'selling_price', 'selling_price_formula',
            'reorder_level', 'reorder_level_formula',
            'is_low_stock'
        ]
        read_only_fields = ['is_low_stock']

    def create(self, validated_data):
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # If formula is sent, store it. If not, clear it.
        for field in ['quantity', 'cost_price', 'selling_price', 'reorder_level']:
            formula_field = f'{field}_formula'
            if formula_field in validated_data:
                if validated_data[formula_field] and validated_data[formula_field].startswith('='):
                    # Keep formula, but also store the calculated value from frontend
                    pass
                else:
                    # Not a formula, clear the formula field
                    validated_data[formula_field] = None
        
        return super().update(instance, validated_data)



"""
class InventoryItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = InventoryItem
        fields = [
            'id', 'sku', 'name', 'category', 'category_name', 
            'quantity', 'cost_price', 'selling_price', 
            'reorder_level', 'is_low_stock', 'last_updated'
        ]
    
    def validate_sku(self, value):
        if self.instance is None and InventoryItem.objects.filter(sku=value).exists():
            raise serializers.ValidationError("SKU already exists")
        return value.upper()"""