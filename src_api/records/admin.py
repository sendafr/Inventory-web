from django.contrib import admin
from records.models import InventoryItem, Category

# Register your models here.
admin.site.register(InventoryItem)
admin.site.register(Category)
