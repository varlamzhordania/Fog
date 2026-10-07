from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import (
    PaymentMethodListView, UserOrderView, ShoppingCartAPIView,
    ShoppingCartItemAPIView, OrderCreateView, OrderPayView, OrderCancelView,
)
from .webhooks import stripe_webhook,xcash_webhook

app_name = 'checkout-v1'

router = SimpleRouter()
router.register('orders', UserOrderView, basename='order')

urlpatterns = [
    path('payment-methods/', PaymentMethodListView.as_view(), name='payment_methods'),
    path('cart/', ShoppingCartAPIView.as_view(), name='cart_detail'),
    path('cart/items/', ShoppingCartItemAPIView.as_view(), name='cart_item_add'),
    path('cart/items/<int:product_id>/', ShoppingCartItemAPIView.as_view(), name='cart_item_modify'),

    path('orders/create/', OrderCreateView.as_view(), name='order_create'),
    path('orders/<int:pk>/pay/', OrderPayView.as_view(), name='order_pay'),
    path('orders/<int:pk>/cancel/', OrderCancelView.as_view(), name='order_cancel'),

    path('webhooks/stripe/', stripe_webhook, name='webhook_stripe'),
    path("webhooks/xcash/", xcash_webhook, name="xcash_webhook"),
]

urlpatterns += router.urls