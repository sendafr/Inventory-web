from django.db import models

# Create your models here.
from users.models import User
from inventory_api.settings import AUTH_USER_MODEL

User = AUTH_USER_MODEL

class TodoItem(models.Model):
    #user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='todos')
    title = models.CharField(max_length=255)
    is_completed = models.BooleanField(default=False)
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_completed', 'due_date'] # Completed items at bottom, sorted by date

    def __str__(self):
        status = "Done" if self.is_completed else "Pending"
        return f"{self.title} ({status})"