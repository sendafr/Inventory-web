from django.urls import path
from . import views

app_name = 'to_dos'

urlpatterns = [
    # Todo Endpoints
    path('get_todo/', views.get_todo, name='get_todo'),
    path('todo_create/', views.todo_create, name='todo_create'),
    path('delete_todo/<int:pk>/', views.delete_todo, name='delete_todo'),
    path('todo_detail/<int:pk>/', views.todo_detail, name='todo_detail'),
]