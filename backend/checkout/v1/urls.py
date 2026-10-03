from django.urls import path

from .views import (
    PaymentMethodListView, UserOrderView, ShoppingCartAPIView,
    ShoppingCartItemAPIView, OrderCreateView, OrderPayView, OrderCancelView,
)

app_name = 'checkout-v1'

urlpatterns = [
    path('payment-methods/', PaymentMethodListView.as_view(), name='payment_methods'),
    path('cart/', ShoppingCartAPIView.as_view(), name='cart_detail'),
    path('cart/items/', ShoppingCartItemAPIView.as_view(), name='cart_item_add'),
    path('cart/items/<int:product_id>/', ShoppingCartItemAPIView.as_view(), name='cart_item_modify'),

    path('orders/create/', OrderCreateView.as_view(), name='order_create'),
    path('orders/<int:pk>/pay/', OrderPayView.as_view(), name='order_pay'),
    path('orders/<int:pk>/cancel/', OrderCancelView.as_view(), name='order_cancel'),
]