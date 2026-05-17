from django.db import models
from inventory_api.settings import AUTH_USER_MODEL
# Create your models here.from django.db import models
from users.models import User
User = AUTH_USER_MODEL

class Budget(models.Model):
    CATEGORY_CHOICES = [
        ('Food', 'Food'),
        ('Transport', 'Transport'),
        ('Utilities', 'Utilities'),
        ('Salary', 'Salary'),
        ('Entertainment', 'Entertainment'),
        ('General', 'General'),
    ]

    #user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budgets')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    limit_amount = models.DecimalField(max_digits=10, decimal_places=2)
    period = models.CharField(max_length=20, default='monthly', choices=[('monthly', 'Monthly'), ('weekly', 'Weekly')])
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('id',  'category', 'period') # Prevent duplicate budgets for same category/period

    def __str__(self):
        return f"{self.category} Budget: {self.limit_amount}"
