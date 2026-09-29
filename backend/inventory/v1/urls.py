from django.urls import path

from .views import (
    CategoryViewSet, TagViewSet, ProductViewSet, ProductPriceRangeView,
)

app_name = 'inventory-v1'

urlpatterns = [
    path('categories/', CategoryViewSet.as_view(), name='categories'),
    path('tags/', TagViewSet.as_view(), name='tags'),
    path('products/', ProductViewSet.as_view(), name='products'),
    path(
        'price-range/',
        ProductPriceRangeView.as_view(),
        name='price-range'
    ),
    path(
        'products/<slug:slug>/',
        ProductViewSet.as_view(),
        name='product-by-slug'
    ),
]
