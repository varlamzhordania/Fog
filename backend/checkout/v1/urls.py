from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import (
    PaymentMethodListView,
    ShoppingCartView,
    ShoppingCartItemView,
    UserOrderView,
)

router = SimpleRouter()
router.register('orders', UserOrderView, basename='order')

app_name = 'checkout-v1'
urlpatterns = [
    path(
        'payment-methods/',
        PaymentMethodListView.as_view(),
        name='payment_methods'
    ),
    path(
        'cart/',
        ShoppingCartView.as_view(),
        name='shopping_cart'
    ),
    path(
        'cart/items/<int:product>/',
        ShoppingCartItemView.as_view(),
        name='shopping_cart_item'
    ),
]

urlpatterns += router.urls
