from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import (
    CategoryViewSet, TagViewSet, ProductViewSet, ProductPriceRangeView,
    HomeView, ProductReviewListCreateView, MyProductReviewView,
)

app_name = 'inventory-v1'

router = SimpleRouter()
router.register('products', ProductViewSet, basename='product')

urlpatterns = [
    path('home/', HomeView.as_view(), name='home'),
    path('categories/', CategoryViewSet.as_view(), name='categories'),
    path('tags/', TagViewSet.as_view(), name='tags'),
    path(
        'price-range/',
        ProductPriceRangeView.as_view(),
        name='price-range'
    ),

    path(
        'products/<str:slug>/reviews/',
        ProductReviewListCreateView.as_view(),
        name='product-reviews'
    ),
    path(
        'products/<str:slug>/reviews/me/',
        MyProductReviewView.as_view(),
        name='product-review-me'
    ),

]

urlpatterns += router.urls
