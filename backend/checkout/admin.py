from django.contrib import admin as django_admin
from django.urls import NoReverseMatch, reverse
from django.utils import timezone
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from unfold import admin
from unfold.decorators import display, action
from django.contrib import messages
from rest_framework.exceptions import APIException
from checkout.services.order import OrderService

from inventory.models import StockReservation
from core.admin import UnfoldImportExportHistoryAdmin

from .models import (
    Order,
    OrderItem,
    OrderPayment,
    OrderShipment,
    PaymentMethod,
    ShoppingCart,
    ShoppingCartItem,
)
from .resources import (
    OrderResource, PaymentMethodResource,
    ShoppingCartResource, OrderPaymentResource,
    OrderShipmentResource,
)


def run_on_orders(modeladmin, request, order_ids, fn, success):
    done = 0
    for order_id in order_ids:
        try:
            fn(order_id)
            done += 1
        except APIException as exc:
            modeladmin.message_user(
                request,
                f"Order #{order_id}: {exc.detail}",
                level=messages.ERROR
            )
    if done:
        modeladmin.message_user(request, success.format(n=done))


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
    readonly_fields = ["paid_at", "status"]


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
    fields = ["id_short", "product_stock", "quantity", "status",
              "expires_at", "is_expired"]
    readonly_fields = ["id_short", "product_stock", "quantity", "status",
                       "expires_at", "is_expired"]
    verbose_name = _("Stock Hold")
    verbose_name_plural = _("Stock Holds")

    @django_admin.display(description=_("Hold ID"))
    def id_short(self, obj):
        return str(obj.id)[:8]

    @django_admin.display(boolean=True, description=_("Expired?"))
    def is_expired(self, obj):
        if obj.expires_at:
            return timezone.now() > obj.expires_at


@django_admin.register(PaymentMethod)
class PaymentMethodAdmin(UnfoldImportExportHistoryAdmin):
    resource_classes = [PaymentMethodResource]
    list_display = ["icon_preview", "name", "code", "min_amount_display",
                    "created_at"]
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
class ShoppingCartAdmin(UnfoldImportExportHistoryAdmin):
    resource_classes = [ShoppingCartResource]
    list_display = ["id_short", "customer_display", "items_count",
                    "created_at"]
    search_fields = ["user__username", "user__email", "user__first_name",
                     "user__last_name"]
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
class OrderAdmin(UnfoldImportExportHistoryAdmin):
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
    list_filter = ["status", "payment__status", "shipment__status",
                   "created_at"]
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
    actions = ["confirm_payment_manually", "mark_processing",
               "mark_shipped",
               "mark_delivered", "refund_orders", "cancel_unpaid"]

    @django_admin.display(description=_("Order #"))
    def id_short(self, obj):
        return format_html(
            '<span class="font-mono font-semibold">#{}</span>',
            str(obj.id)[:8]
        )

    @django_admin.display(description=_("Customer"))
    def customer_display(self, obj):
        if obj.user:
            name = obj.user.get_full_name().strip()
            return f"{name} ({obj.user.email})" if name else obj.user.email
        return _("Anonymous")

    @django_admin.display(description=_("Total"))
    def total_price_display(self, obj):
        return f"${obj.total_price:,.2f}"

    @display(
        description=_("Order Status"),
        ordering="status",
        label={
            Order.StatusChoices.PAYMENT: "warning",
            Order.StatusChoices.PENDING: "info",
            Order.StatusChoices.PROCESSING: "info",
            Order.StatusChoices.SHIPPED: "success",
            Order.StatusChoices.DELIVERED: "success",
            Order.StatusChoices.CANCELLED: "danger",
        }
    )
    def status_badge(self, obj):
        return obj.status, obj.get_status_display()

    @display(
        description=_("Payment"),
        label={
            OrderPayment.StatusChoices.PENDING: "warning",
            OrderPayment.StatusChoices.COMPLETED: "success",
            OrderPayment.StatusChoices.FAILED: "danger",
            OrderPayment.StatusChoices.REFUNDED: "info",
        }
    )
    def payment_status_badge(self, obj):
        payment = getattr(obj, "payment", None)
        if not payment:
            return None, "None"

        # Preserves your original text format combining status and method
        display_text = f"{payment.get_status_display()} ({payment.method})"
        return payment.status, display_text

    @display(
        description=_("Shipment"),
        label={
            OrderShipment.StatusChoices.PENDING: "warning",
            OrderShipment.StatusChoices.IN_TRANSIT: "info",
            OrderShipment.StatusChoices.DELIVERED: "success",
        }
    )
    def shipment_status_badge(self, obj):
        shipment = getattr(obj, "shipment", None)
        if not shipment:
            return None, "—"

        return shipment.status, shipment.get_status_display()

    @django_admin.action(
        description=_("Confirm payment manually (commits stock)")
        )
    def confirm_payment_manually(self, request, queryset):
        run_on_orders(
            self,
            request,
            [o.pk for o in queryset],
            OrderService.confirm_payment,
            "Confirmed payment on {n} order(s)."
            )

    @action(description=_("Start processing"))
    def mark_processing(self, request, queryset):
        run_on_orders(
            self, request, [o.pk for o in queryset],
            OrderService.start_processing, "{n} order(s) now processing."
            )

    @action(description=_("Mark as shipped"))
    def mark_shipped(self, request, queryset):
        run_on_orders(
            self, request, [o.pk for o in queryset],
            OrderService.mark_shipped, "{n} order(s) shipped."
            )

    @action(description=_("Mark as delivered"))
    def mark_delivered(self, request, queryset):
        run_on_orders(
            self, request, [o.pk for o in queryset],
            OrderService.mark_delivered, "{n} order(s) delivered."
            )

    @action(description=_("Refund (before dispatch) and restock"))
    def refund_orders(self, request, queryset):
        run_on_orders(
            self, request, [o.pk for o in queryset],
            lambda pk: OrderService.refund_order(
                pk,
                performed_by=request.user
                ),
            "Refunded {n} order(s)."
            )

    @action(description=_("Cancel unpaid order and release stock"))
    def cancel_unpaid(self, request, queryset):
        run_on_orders(
            self, request, [o.pk for o in queryset],
            lambda pk: OrderService.cancel_order(
                pk,
                "Cancelled by staff."
                ),
            "Processed {n} order(s)."
            )


@django_admin.register(OrderPayment)
class OrderPaymentAdmin(UnfoldImportExportHistoryAdmin):
    resource_classes = [OrderPaymentResource]
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

    @display(description=_("Order"))
    def order_link(self, obj):
        try:
            url = reverse(
                "admin:checkout_order_change",
                args=[obj.order.id]
            )
            return format_html(
                '<a href="{}" class="font-semibold text-primary-600 underline">Order #{}</a>',
                url,
                str(obj.order.id)[:8],
            )
        except (NoReverseMatch, AttributeError):
            return f"Order #{str(obj.order.id)[:8]}"

    @display(description=_("Amount"))
    def amount_display(self, obj):
        return f"${obj.amount:,.2f}"

    @display(description=_("Transaction ID"))
    def transaction_id_display(self, obj):
        if not obj.transaction_id:
            return "—"
        return format_html(
            '<span class="font-mono text-xs">{}</span>',
            obj.transaction_id
        )

    @display(
        description=_("Status"),
        ordering="status",
        label={
            OrderPayment.StatusChoices.PENDING: "warning",
            OrderPayment.StatusChoices.COMPLETED: "success",
            OrderPayment.StatusChoices.FAILED: "danger",
            OrderPayment.StatusChoices.REFUNDED: "info",
        }
    )
    def status_badge(self, obj):
        return obj.status, obj.get_status_display()

    @action(description=_("Confirm payment (marks order paid, commits stock)"))
    def mark_as_completed(self, request, queryset):
        run_on_orders(self, request, [p.order_id for p in queryset],
                      OrderService.confirm_payment, "Confirmed {n} payment(s).")

    @action(description=_("Mark as failed (cancels unpaid order, releases stock)"))
    def mark_as_failed(self, request, queryset):
        run_on_orders(self, request, [p.order_id for p in queryset],
                      lambda pk: OrderService.cancel_order(pk, "Payment marked as failed by staff."),
                      "Processed {n} payment(s).")


@django_admin.register(OrderShipment)
class OrderShipmentAdmin(UnfoldImportExportHistoryAdmin):
    resource_classes = [OrderShipmentResource]
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
    readonly_fields = ["shipped_at", "delivered_at", "created_at",
                       "updated_at"]
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
            url = reverse(
                "admin:checkout_order_change",
                args=[obj.order.id]
            )
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
        return format_html(
            '<span class="font-mono text-xs font-semibold">{}</span>',
            obj.tracking_number
        )

    @display(
        description=_("Status"),
        ordering="status",
        label={
            OrderShipment.StatusChoices.PENDING: "warning",
            OrderShipment.StatusChoices.IN_TRANSIT: "info",
            OrderShipment.StatusChoices.DELIVERED: "success",
        }
    )
    def status_badge(self, obj):
        return obj.status, obj.get_status_display()

    @action(description=_("Mark selected shipments as IN TRANSIT"))
    def mark_as_shipped_action(self, request, queryset):
        run_on_orders(self, request, [s.order_id for s in queryset],
                      OrderService.mark_shipped, "Marked {n} shipment(s) as in transit.")

    @action(description=_("Mark selected shipments as DELIVERED"))
    def mark_as_delivered_action(self, request, queryset):
        run_on_orders(self, request, [s.order_id for s in queryset],
                      OrderService.mark_delivered, "Marked {n} shipment(s) as delivered.")
