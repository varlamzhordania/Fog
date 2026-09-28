from django.urls import path

from .views import CategoryViewSet

app_name = 'inventory-v1'

urlpatterns = [
    path('categories/', CategoryViewSet.as_view(), name='categories'),
]
