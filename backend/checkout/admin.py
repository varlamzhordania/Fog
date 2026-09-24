import nested_admin
from django.contrib import admin
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from import_export.admin import ImportExportMixin

from .models import (
    Order,
    OrderItem,
    Shipment,
)
from .resource import OrderResource

from inventory.admin import StockReservationInline


class OrderItemInline(nested_admin.NestedTabularInline):
    model = OrderItem
    extra = 0
    fields = ["product", "quantity", "unit_price", "total_price"]
    readonly_fields = ["product", "quantity", "unit_price", "total_price"]
    can_delete = False


class ShipmentInline(nested_admin.NestedStackedInline):
    model = Shipment
    extra = 0
    fields = [
        ("carrier", "tracking_number"),
        ("status", "dispatched_at", "delivered_at"),
    ]



@admin.register(Order)
class OrderAdmin(ImportExportMixin, nested_admin.NestedModelAdmin):
    resource_classes = [OrderResource]
    inlines = [OrderItemInline, ShipmentInline, StockReservationInline]

    list_display = [
        "id_short",
        "status_badge",
        "total_amount",
        "customer_info",
        "created_at",
    ]
    list_filter = ["status", "created_at"]
    search_fields = ["id", "order_token", "user__email"]
    readonly_fields = [
        "id",
        "order_token",
        "created_at",
        "updated_at",
    ]
    ordering = ["-created_at"]

    fieldsets = [
        (
            _("Order Identification"),
            {
                "fields": (
                    "id", "order_token", "user", "status", "total_amount")
            },
        ),
        (
            _("Encrypted Shipping Information (PGP)"),
            {
                "fields": ("encrypted_shipping_address", "customer_notes"),
                "classes": ["collapse"],
            },
        ),
        (
            _("System Timestamps"),
            {
                "fields": ("created_at", "updated_at"),
            },
        ),
    ]

    @admin.display(description=_("Order ID"))
    def id_short(self, obj):
        return str(obj.id)[:8]

    @admin.display(description=_("Customer"))
    def customer_info(self, obj):
        if obj.user:
            return obj.user.email
        return format_html(
            '<span style="color: gray; font-style: italic;">Anonymous Guest</span>'
        )

    @admin.display(description=_("Status"))
    def status_badge(self, obj):
        colors = {
            Order.StatusChoices.PENDING_PAYMENT: "orange",
            Order.StatusChoices.PAYMENT_DETECTED: "blue",
            Order.StatusChoices.PAID: "green",
            Order.StatusChoices.PROCESSING: "teal",
            Order.StatusChoices.SHIPPED: "purple",
            Order.StatusChoices.DELIVERED: "darkgreen",
            Order.StatusChoices.EXPIRED: "gray",
            Order.StatusChoices.CANCELLED: "red",
        }
        color = colors.get(obj.status, "black")
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display(),
        )


@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = ["order", "carrier", "tracking_number", "status",
                    "dispatched_at"]
    list_filter = ["status", "carrier"]
    search_fields = ["tracking_number", "order__id"]
