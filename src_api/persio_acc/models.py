from django.db import models

# Create your models here.
# persio_acc/models.py


class Transaction(models.Model):
    date = models.DateField()
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=[('income', 'Income'), ('expense', 'Expense')])

    def __str__(self):
        return f"{self.date} - {self.description} ({self.type})"