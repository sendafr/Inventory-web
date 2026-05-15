from django.db import models
from django.core.validators import MinValueValidator
# Create your models here."""

# models.py
from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

class InventoryItem(models.Model):
    sku = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='inventory_items')
    
    quantity = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    quantity_formula = models.TextField(blank=True, null=True)
    
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cost_price_formula = models.TextField(blank=True, null=True)
    
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    selling_price_formula = models.TextField(blank=True, null=True)
    
    reorder_level = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    reorder_level_formula = models.TextField(blank=True, null=True)
    
    is_low_stock = models.BooleanField(default=False)
    last_updated = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Auto set low stock flag
        self.is_low_stock = self.quantity < self.reorder_level
        super().save(*args, **kwargs)



"""
class InventoryItem(models.Model):
    sku = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='items')
    quantity = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    selling_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    reorder_level = models.IntegerField(default=10)
    last_updated = models.DateTimeField(auto_now=True)
    
    @property
    def is_low_stock(self):
        return self.quantity <= self.reorder_level
    
    def __str__(self):
        return f"{self.sku} - {self.name}"
        """