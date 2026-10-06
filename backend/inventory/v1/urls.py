from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import (
    CategoryViewSet, TagViewSet, ProductViewSet, ProductPriceRangeView,
    HomeView,
)

app_name = 'inventory-v1'

router = SimpleRouter()
router.register('products', ProductViewSet,basename='product')


urlpatterns = [
    path('home/', HomeView.as_view(), name='home'),
    path('categories/', CategoryViewSet.as_view(), name='categories'),
    path('tags/', TagViewSet.as_view(), name='tags'),
    path(
        'price-range/',
        ProductPriceRangeView.as_view(),
        name='price-range'
    ),
]

urlpatterns += router.urls