from decimal import Decimal
from django.contrib import admin as django_admin
from django.urls import NoReverseMatch, reverse
from django.utils import timezone
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from import_export.admin import ImportExportMixin
from unfold import admin

from inventory.models import StockReservation
from .models import (
    Order,
    OrderItem,
    OrderPayment,
    OrderShipment,
    PaymentMethod,
    ShoppingCart,
    ShoppingCartItem,
)
from .resources import OrderResource


# ==============================================================================
# INLINE DEFINITIONS
# ==============================================================================

class ShoppingCartItemInline(admin.TabularInline):
    model = ShoppingCartItem
    extra = 0
    fields = ["product", "quantity", "created_at"]
    readonly_fields = ["created_at"]


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    fields = ["product", "quantity", "unit_price", "total_price"]
    readonly_fields = ["total_price"]


class OrderPaymentInline(admin.StackedInline):
    model = OrderPayment
    extra = 0
    can_delete = False
    fields = [
        ("method", "status"),
        ("amount", "transaction_id"),
        "paid_at",
    ]
    readonly_fields = ["paid_at"]


class OrderShipmentInline(admin.StackedInline):
    model = OrderShipment
    extra = 0
    can_delete = False
    fields = [
        ("carrier", "tracking_number"),
        "status",
        ("shipped_at", "delivered_at"),
        "notes",
    ]
    readonly_fields = ["shipped_at", "delivered_at"]


class OrderStockReservationInline(admin.TabularInline):
    model = StockReservation
    extra = 0
    can_delete = False
    fields = ["id_short", "product_stock", "quantity", "status", "expires_at", "is_expired"]
    readonly_fields = ["id_short", "product_stock", "quantity", "status", "expires_at", "is_expired"]
    verbose_name = _("Stock Hold")
    verbose_name_plural = _("Stock Holds")

    @django_admin.display(description=_("Hold ID"))
    def id_short(self, obj):
        return str(obj.id)[:8]

    @django_admin.display(boolean=True, description=_("Expired?"))
    def is_expired(self, obj):
        return timezone.now() > obj.expires_at


# ==============================================================================
# MODEL ADMIN DEFINITIONS
# ==============================================================================

@django_admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ["icon_preview", "name", "code", "min_amount_display", "created_at"]
    search_fields = ["name", "code", "description"]
    readonly_fields = ["created_at", "updated_at"]
    ordering = ["name"]

    fieldsets = [
        (
            _("General Info"),
            {
                "fields": (
                    "name",
                    "code",
                    "icon",
                    "min_amount",
                    "description",
                )
            },
        ),
        (
            _("Timestamps"),
            {
                "classes": ["collapse"],
                "fields": (("created_at", "updated_at"),),
            },
        ),
    ]

    @django_admin.display(description=_("Icon"))
    def icon_preview(self, obj):
        if obj.icon:
            return format_html(
                '<img src="{}" style="width: 28px; height: 28px; object-fit: contain; border-radius: 4px;" />',
                obj.icon.url,
            )
        return "—"

    @django_admin.display(description=_("Min Order Amount"))
    def min_amount_display(self, obj):
        return f"${obj.min_amount:,.2f}"


@django_admin.register(ShoppingCart)
class ShoppingCartAdmin(admin.ModelAdmin):
    list_display = ["id_short", "customer_display", "items_count", "created_at"]
    search_fields = ["user__username", "user__email", "user__first_name", "user__last_name"]
    readonly_fields = ["created_at", "updated_at"]
    inlines = [ShoppingCartItemInline]
    ordering = ["-created_at"]

    @django_admin.display(description=_("Cart ID"))
    def id_short(self, obj):
        return str(obj.id)[:8]

    @django_admin.display(description=_("Customer"))
    def customer_display(self, obj):
        if obj.user:
            name = obj.user.get_full_name().strip()
            return f"{name} ({obj.user.email})" if name else obj.user.email
        return _("Unknown User")

    @django_admin.display(description=_("Item Count"))
    def items_count(self, obj):
        return obj.items.count()


@django_admin.register(Order)
class OrderAdmin(ImportExportMixin, admin.ModelAdmin):
    resource_classes = [OrderResource]
    inlines = [
        OrderItemInline,
        OrderPaymentInline,
        OrderShipmentInline,
        OrderStockReservationInline,
    ]

    list_display = [
        "id_short",
        "customer_display",
        "status_badge",
        "payment_status_badge",
        "shipment_status_badge",
        "total_price_display",
        "created_at",
    ]
    list_filter = ["status", "payment__status", "shipment__status", "created_at"]
    search_fields = [
        "id",
        "user__email",
        "user__username",
        "user__first_name",
        "user__last_name",
        "payment__transaction_id",
        "shipment__tracking_number",
    ]
    readonly_fields = ["id", "created_at", "updated_at"]
    ordering = ["-created_at"]

    fieldsets = [
        (
            _("Order Information"),
            {
                "fields": (
                    "id",
                    "user",
                    "delivery_address",
                    "status",
                    "total_price",
                )
            },
        ),
        (
            _("Fulfillment & Delivery Notes"),
            {
                "fields": ("notes",),
            },
        ),
        (
            _("Timestamps"),
            {
                "classes": ["collapse"],
                "fields": (("created_at", "updated_at"),),
            },
        ),
    ]

    @django_admin.display(description=_("Order #"))
    def id_short(self, obj):
        return format_html('<span class="font-mono font-semibold">#{}</span>', str(obj.id)[:8])

    @django_admin.display(description=_("Customer"))
    def customer_display(self, obj):
        if obj.user:
            name = obj.user.get_full_name().strip()
            return f"{name} ({obj.user.email})" if name else obj.user.email
        return _("Anonymous")

    @django_admin.display(description=_("Total"))
    def total_price_display(self, obj):
        return f"${obj.total_price:,.2f}"

    @django_admin.display(description=_("Order Status"))
    def status_badge(self, obj):
        styles = {
            Order.StatusChoices.PAYMENT: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
            Order.StatusChoices.PENDING: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
            Order.StatusChoices.PROCESSING: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
            Order.StatusChoices.SHIPPED: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
            Order.StatusChoices.DELIVERED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
            Order.StatusChoices.CANCELLED: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
        }
        css = styles.get(obj.status, "bg-gray-100 text-gray-700")
        return format_html(
            '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold {}">{}</span>',
            css,
            obj.get_status_display(),
        )

    @django_admin.display(description=_("Payment"))
    def payment_status_badge(self, obj):
        payment = getattr(obj, "payment", None)
        if not payment:
            return format_html('<span class="text-xs text-gray-400">None</span>')

        styles = {
            OrderPayment.StatusChoices.PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
            OrderPayment.StatusChoices.COMPLETED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
            OrderPayment.StatusChoices.FAILED: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
            OrderPayment.StatusChoices.REFUNDED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        }
        css = styles.get(payment.status, "bg-gray-100 text-gray-700")
        return format_html(
            '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold {}">{} ({})</span>',
            css,
            payment.get_status_display(),
            payment.method,
        )

    @django_admin.display(description=_("Shipment"))
    def shipment_status_badge(self, obj):
        shipment = getattr(obj, "shipment", None)
        if not shipment:
            return format_html('<span class="text-xs text-gray-400">—</span>')

        styles = {
            OrderShipment.StatusChoices.PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
            OrderShipment.StatusChoices.IN_TRANSIT: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
            OrderShipment.StatusChoices.DELIVERED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
        }
        css = styles.get(shipment.status, "bg-gray-100 text-gray-700")
        return format_html(
            '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold {}">{}</span>',
            css,
            shipment.get_status_display(),
        )


@django_admin.register(OrderPayment)
class OrderPaymentAdmin(admin.ModelAdmin):
    list_display = [
        "order_link",
        "method",
        "amount_display",
        "status_badge",
        "transaction_id_display",
        "paid_at",
    ]
    list_filter = ["status", "method", "created_at"]
    search_fields = ["order__id", "transaction_id", "method"]
    readonly_fields = ["created_at", "updated_at", "paid_at"]
    actions = ["mark_as_completed", "mark_as_failed"]

    fieldsets = [
        (
            _("Payment Details"),
            {
                "fields": (
                    "order",
                    "method",
                    "amount",
                    "status",
                    "transaction_id",
                    "paid_at",
                )
            },
        ),
        (
            _("Timestamps"),
            {
                "classes": ["collapse"],
                "fields": (("created_at", "updated_at"),),
            },
        ),
    ]

    @django_admin.display(description=_("Order"))
    def order_link(self, obj):
        try:
            url = reverse("admin:checkout_order_change", args=[obj.order.id])
            return format_html(
                '<a href="{}" class="font-semibold text-primary-600 underline">Order #{}</a>',
                url,
                str(obj.order.id)[:8],
            )
        except (NoReverseMatch, AttributeError):
            return f"Order #{str(obj.order.id)[:8]}"

    @django_admin.display(description=_("Amount"))
    def amount_display(self, obj):
        return f"${obj.amount:,.2f}"

    @django_admin.display(description=_("Transaction ID"))
    def transaction_id_display(self, obj):
        if not obj.transaction_id:
            return "—"
        return format_html('<span class="font-mono text-xs">{}</span>', obj.transaction_id)

    @django_admin.display(description=_("Status"))
    def status_badge(self, obj):
        styles = {
            OrderPayment.StatusChoices.PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
            OrderPayment.StatusChoices.COMPLETED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
            OrderPayment.StatusChoices.FAILED: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
            OrderPayment.StatusChoices.REFUNDED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        }
        css = styles.get(obj.status, "bg-gray-100 text-gray-700")
        return format_html(
            '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold {}">{}</span>',
            css,
            obj.get_status_display(),
        )

    @django_admin.action(description=_("Mark selected payments as COMPLETED"))
    def mark_as_completed(self, request, queryset):
        count = 0
        for payment in queryset:
            payment.mark_completed()
            count += 1
        self.message_user(request, f"Marked {count} payment(s) as completed.")

    @django_admin.action(description=_("Mark selected payments as FAILED"))
    def mark_as_failed(self, request, queryset):
        count = 0
        for payment in queryset:
            payment.mark_failed()
            count += 1
        self.message_user(request, f"Marked {count} payment(s) as failed.")


@django_admin.register(OrderShipment)
class OrderShipmentAdmin(admin.ModelAdmin):
    list_display = [
        "order_link",
        "carrier",
        "tracking_number_display",
        "status_badge",
        "shipped_at",
        "delivered_at",
    ]
    list_filter = ["status", "carrier", "created_at"]
    search_fields = ["order__id", "tracking_number", "carrier", "notes"]
    readonly_fields = ["shipped_at", "delivered_at", "created_at", "updated_at"]
    actions = ["mark_as_shipped_action", "mark_as_delivered_action"]

    fieldsets = [
        (
            _("Shipment Details"),
            {
                "fields": (
                    "order",
                    "carrier",
                    "tracking_number",
                    "status",
                    ("shipped_at", "delivered_at"),
                    "notes",
                )
            },
        ),
        (
            _("Timestamps"),
            {
                "classes": ["collapse"],
                "fields": (("created_at", "updated_at"),),
            },
        ),
    ]

    @django_admin.display(description=_("Order"))
    def order_link(self, obj):
        try:
            url = reverse("admin:checkout_order_change", args=[obj.order.id])
            return format_html(
                '<a href="{}" class="font-semibold text-primary-600 underline">Order #{}</a>',
                url,
                str(obj.order.id)[:8],
            )
        except (NoReverseMatch, AttributeError):
            return f"Order #{str(obj.order.id)[:8]}"

    @django_admin.display(description=_("Tracking #"))
    def tracking_number_display(self, obj):
        if not obj.tracking_number:
            return "—"
        return format_html('<span class="font-mono text-xs font-semibold">{}</span>', obj.tracking_number)

    @django_admin.display(description=_("Status"))
    def status_badge(self, obj):
        styles = {
            OrderShipment.StatusChoices.PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
            OrderShipment.StatusChoices.IN_TRANSIT: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
            OrderShipment.StatusChoices.DELIVERED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
        }
        css = styles.get(obj.status, "bg-gray-100 text-gray-700")
        return format_html(
            '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold {}">{}</span>',
            css,
            obj.get_status_display(),
        )

    @django_admin.action(description=_("Mark selected shipments as IN TRANSIT"))
    def mark_as_shipped_action(self, request, queryset):
        count = 0
        for shipment in queryset:
            shipment.mark_shipped()
            count += 1
        self.message_user(request, f"Marked {count} shipment(s) as in transit.")

    @django_admin.action(description=_("Mark selected shipments as DELIVERED"))
    def mark_as_delivered_action(self, request, queryset):
        count = 0
        for shipment in queryset:
            shipment.mark_delivered()
            count += 1
        self.message_user(request, f"Marked {count} shipment(s) as delivered.")