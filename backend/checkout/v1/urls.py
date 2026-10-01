from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import (
    PaymentMethodListView,
    UserOrderView, ShoppingCartAPIView, ShoppingCartItemAPIView,
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
    path('cart/', ShoppingCartAPIView.as_view(), name='cart_detail'),
    path(
        'cart/items/',
        ShoppingCartItemAPIView.as_view(),
        name='cart_item_add'
    ),
    path(
        'cart/items/<int:pk>/',
        ShoppingCartItemAPIView.as_view(),
        name='cart_item_modify'
    ),

]

urlpatterns += router.urls
