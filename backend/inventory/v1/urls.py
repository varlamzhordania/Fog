from django.urls import path

from .views import CategoryViewSet, TagViewSet

app_name = 'inventory-v1'

urlpatterns = [
    path('categories/', CategoryViewSet.as_view(), name='categories'),
    path('tags/', TagViewSet.as_view(), name='tags'),
]
