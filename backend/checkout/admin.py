import nested_admin
from unfold import admin
from django.contrib import admin as django_admin
from import_export.admin import ExportMixin

from .models import (
    PaymentMethod,
    ShoppingCart,
    ShoppingCartItem,
    OrderPayment,
    Order,
    OrderItem,
    OrderShipment,
)
from .resources import (
    ShoppingCartResource,
    ShoppingCartItemResource,
    PaymentResource,
    OrderResource,
    OrderItemResource,
    OrderShipmentResource,
    PaymentMethodResource,
)


class ShoppingCartItemInline(nested_admin.NestedTabularInline):
    model = ShoppingCartItem
    extra = 0
    fields = ('product', 'quantity')


@django_admin.register(PaymentMethod)
class PaymentMethodAdmin(ExportMixin, admin.ModelAdmin):
    resource_class = PaymentMethodResource
    list_display = (
        'name', 'code', 'min_amount',
        'is_active', 'created_at', 'updated_at')
    search_fields = ('name',)
    ordering = ('name',)


@django_admin.register(ShoppingCart)
class ShoppingCartAdmin(ExportMixin, nested_admin.NestedModelAdmin):
    resource_class = ShoppingCartResource
    list_display = ('user', 'created_at', 'updated_at')
    search_fields = ('user__email',)
    ordering = ('-created_at',)
    inlines = (ShoppingCartItemInline,)


@django_admin.register(ShoppingCartItem)
class ShoppingCartItemAdmin(ExportMixin, admin.ModelAdmin):
    resource_class = ShoppingCartItemResource
    list_display = (
        'cart', 'product', 'quantity',
        'created_at',
        'updated_at')
    search_fields = ('product__name',)
    ordering = ('-created_at',)


@django_admin.register(OrderPayment)
class PaymentAdmin(ExportMixin, admin.ModelAdmin):
    resource_class = PaymentResource
    list_display = (
        'order', 'amount', 'status', 'method', 'paid_at',
        'created_at')
    search_fields = ('order__id', 'transaction_id', 'method')
    list_filter = ('status', 'method')
    ordering = ('-created_at',)


class OrderPaymentInline(nested_admin.NestedStackedInline):
    model = OrderPayment
    extra = 0
    fields = (
        "order",
        "amount",
        "status",
        "method",
        "transaction_id",
        "paid_at",
        "created_at",
        "updated_at"
    )
    readonly_fields = (
        'amount', 'transaction_id', 'paid_at', 'created_at',
        'updated_at')


class OrderItemInline(nested_admin.NestedStackedInline):
    model = OrderItem
    extra = 0
    fields = (
        'product', 'quantity', 'unit_price',
        'total_price')
    readonly_fields = ('total_price',)


class OrderShipmentInline(nested_admin.NestedStackedInline):
    model = OrderShipment
    extra = 0
    fields = (
        'tracking_number', 'carrier', 'status', 'shipped_at',
        'delivered_at')


@django_admin.register(Order)
class OrderAdmin(ExportMixin, nested_admin.NestedModelAdmin):
    resource_class = OrderResource
    list_display = (
        'id', 'user', 'status', 'total_price', 'is_active',
        'created_at',
        'updated_at')
    list_filter = ('status', 'is_active', 'created_at')
    search_fields = ('user__email', 'notes')
    inlines = [OrderPaymentInline, OrderShipmentInline, OrderItemInline]


@django_admin.register(OrderItem)
class OrderItemAdmin(ExportMixin, admin.ModelAdmin):
    resource_class = OrderItemResource
    list_display = (
        'order', 'product', 'quantity',
        'unit_price', 'total_price')
    list_filter = ('order__status',)
    search_fields = ('product__name', 'order__user__email')


@django_admin.register(OrderShipment)
class OrderShipmentAdmin(ExportMixin, admin.ModelAdmin):
    resource_class = OrderShipmentResource
    list_display = (
        'order', 'tracking_number', 'carrier', 'status', 'shipped_at',
        'delivered_at')
    list_filter = ('status', 'carrier')
    search_fields = ('tracking_number', 'order__user__email')
