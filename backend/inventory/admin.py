import nested_admin
from django.contrib import admin as django_admin
from django.urls import NoReverseMatch, reverse
from django.utils import timezone
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from import_export.admin import ImportExportMixin
from treebeard.admin import TreeAdmin
from treebeard.forms import movenodeform_factory
from unfold import admin

from .models import (
    Category,
    Media,
    Product,
    ProductMedia,
    ProductStock,
    StockReservation,
    StockTransactionLog,
)
from .resources import ProductResource


class ProductMediaInline(
    admin.StackedInline,
    nested_admin.NestedTabularInline
):
    model = ProductMedia
    extra = 1
    fields = ["media", "is_featured", "display_order"]
    classes = ["collapse"]


class StockReservationInline(admin.TabularInline):
    model = StockReservation
    extra = 0
    fields = ["id_short", "order_link", "quantity", "status", "expires_at",
              "is_expired"]
    readonly_fields = ["id_short", "order_link", "quantity", "status",
                       "expires_at", "is_expired"]
    can_delete = False
    show_change_link = True

    @django_admin.display(description=_("ID"))
    def id_short(self, obj):
        return str(obj.id)[:8]

    @django_admin.display(description=_("Order"))
    def order_link(self, obj):
        if not getattr(obj, "order", None):
            return "—"
        try:
            url = reverse(
                "admin:checkout_order_change",
                args=[obj.order.id]
            )
            return format_html(
                '<a href="{}" class="font-semibold text-primary-600 underline">Order #{}</a>',
                url,
                str(obj.order.id)[:8]
            )
        except NoReverseMatch:
            return f"Order #{str(obj.order.id)[:8]}"

    @django_admin.display(boolean=True, description=_("Expired?"))
    def is_expired(self, obj):
        return timezone.now() > obj.expires_at


class ProductStockInline(
    admin.StackedInline,
    nested_admin.NestedStackedInline
):
    model = ProductStock
    extra = 0
    can_delete = False
    fields = [
        "quantity",
        "reserved_quantity",
        "low_stock_threshold",
        "is_available",
    ]


@django_admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
    list_display = ["preview", "title", "media_type", "file", "created_at"]
    list_filter = ["media_type", "created_at"]
    search_fields = ["title", "alt_text", "file"]
    readonly_fields = ["id", "created_at", "updated_at"]

    @django_admin.display(description=_("Preview"))
    def preview(self, obj):
        if obj.media_type == Media.TypeChoices.IMAGE and obj.file:
            return format_html(
                '<img src="{}" style="width: 42px; height: 42px; object-fit: cover; border-radius: 6px;" />',
                obj.file.url,
            )
        return "—"


@django_admin.register(Category)
class CategoryAdmin(ImportExportMixin, TreeAdmin, admin.ModelAdmin):
    form = movenodeform_factory(Category)
    list_display = ["name", "slug", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["name", "slug"]

    class Media:
        css = {
            "all": [
                "treebeard/treebeard-admin.css",
                "css/treebeard-unfold.css",
            ]
        }


@django_admin.register(Product)
class ProductAdmin(
    ImportExportMixin,
    nested_admin.NestedModelAdmin,
    admin.ModelAdmin
):
    resource_classes = [ProductResource]
    inlines = [ProductStockInline, ProductMediaInline]

    list_display = [
        "name",
        "sku",
        "category",
        "product_type",
        "base_price",
        "stock_status",
        "is_active",
        "is_featured",
    ]
    list_filter = ["product_type", "is_active", "is_featured", "category"]
    search_fields = ["name", "sku", "slug"]
    ordering = ["-created_at"]

    fieldsets = [
        (
            _("Product Details"),
            {
                "fields": (
                    "name",
                    "slug",
                    "sku",
                    "category",
                    "product_type",
                    "base_price",
                )
            },
        ),
        (
            _("Descriptions"),
            {
                "fields": ("short_description", "description"),
            },
        ),
        (
            _("Store Visibility"),
            {
                "fields": (("is_active", "is_featured"),),
            },
        ),
    ]
    readonly_fields = ["id", "slug", "created_at", "updated_at"]

    @django_admin.display(description=_("Inventory on Hand (Avail / Res)"))
    def stock_status(self, obj):
        try:
            stock = obj.product_stock
            if not stock.is_available or stock.available_quantity <= 0:
                badge_class = "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
            elif stock.is_below_threshold():
                badge_class = "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
            else:
                badge_class = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"

            return format_html(
                '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold {}">'
                '{} avail <span class="ml-1 opacity-70">({} res / {} tot)</span>'
                '</span>',
                badge_class,
                stock.available_quantity,
                stock.reserved_quantity,
                stock.quantity,
            )
        except ProductStock.DoesNotExist:
            return format_html(
                '<span class="text-xs text-gray-400">No stock record</span>'
            )


@django_admin.register(ProductStock)
class ProductStockAdmin(admin.ModelAdmin):
    inlines = [StockReservationInline]
    list_display = [
        "product",
        "quantity",
        "reserved_quantity",
        "available_display",
        "low_stock_threshold",
        "is_available",
    ]
    list_filter = ["is_available"]
    search_fields = ["product__name", "product__sku"]
    readonly_fields = ["reserved_quantity"]

    @django_admin.display(description=_("Available Quantity"))
    def available_display(self, obj):
        return obj.available_quantity


@django_admin.register(StockReservation)
class StockReservationAdmin(admin.ModelAdmin):
    list_display = [
        "id_short",
        "order_link",
        "product_stock",
        "quantity",
        "status_badge",
        "expires_at",
        "is_expired",
    ]
    list_filter = ["status", "created_at"]
    search_fields = ["id", "order__id", "product_stock__product__name"]
    readonly_fields = ["id", "created_at", "updated_at"]
    actions = ["manually_release_reservations"]

    @django_admin.display(description=_("ID"))
    def id_short(self, obj):
        return str(obj.id)[:8]

    @django_admin.display(description=_("Order"))
    def order_link(self, obj):
        if not getattr(obj, "order", None):
            return "—"
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
        except NoReverseMatch:
            return f"Order #{str(obj.order.id)[:8]}"

    @django_admin.display(description=_("Status"))
    def status_badge(self, obj):
        colors = {
            StockReservation.ReservationStatus.ACTIVE: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
            StockReservation.ReservationStatus.COMMITTED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
            StockReservation.ReservationStatus.RELEASED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        }
        css = colors.get(obj.status, "bg-gray-100 text-gray-800")
        return format_html(
            '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold {}">{}</span>',
            css,
            obj.get_status_display(),
        )

    @django_admin.display(boolean=True, description=_("Expired?"))
    def is_expired(self, obj):
        return timezone.now() > obj.expires_at

    @django_admin.action(
        description=_("Manually release selected active holds")
    )
    def manually_release_reservations(self, request, queryset):
        active_holds = queryset.filter(
            status=StockReservation.ReservationStatus.ACTIVE
        )
        count = 0
        for hold in active_holds:
            hold.release(
                reason=f"Manually released via admin by {request.user.username}"
            )
            count += 1
        self.message_user(
            request,
            f"Successfully released {count} stock reservation(s)."
        )


@django_admin.register(StockTransactionLog)
class StockTransactionLogAdmin(admin.ModelAdmin):
    list_display = [
        "created_at",
        "product_stock",
        "action_badge",
        "quantity",
        "performed_by",
        "note",
    ]
    list_filter = ["action", "created_at"]
    search_fields = ["product_stock__product__name", "note"]
    readonly_fields = [
        "product_stock",
        "action",
        "quantity",
        "performed_by",
        "note",
        "created_at",
        "updated_at",
    ]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    @django_admin.display(description=_("Action"))
    def action_badge(self, obj):
        colors = {
            StockTransactionLog.ActionChoices.RESTOCK: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
            StockTransactionLog.ActionChoices.ORDER_DEDUCTION: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
            StockTransactionLog.ActionChoices.RESERVE: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
            StockTransactionLog.ActionChoices.RELEASE_RESERVATION: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
            StockTransactionLog.ActionChoices.ADJUSTMENT: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
        }
        css = colors.get(obj.action, "bg-gray-100 text-gray-800")
        return format_html(
            '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold {}">{}</span>',
            css,
            obj.get_action_display(),
        )
