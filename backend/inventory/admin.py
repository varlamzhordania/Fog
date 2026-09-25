import nested_admin
from django.contrib import admin
from django.utils import timezone
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from import_export.admin import ImportExportMixin
from treebeard.admin import TreeAdmin
from treebeard.forms import movenodeform_factory

from .models import (
    Media,
    Category,
    Product,
    ProductMedia,
    ProductStock,
    StockReservation,
    StockTransactionLog,
)
from .resources import ProductResource


class ProductMediaInline(nested_admin.NestedTabularInline):
    model = ProductMedia
    extra = 1
    fields = ["media", "is_featured", "display_order"]
    classes = ["collapse"]


class ProductStockInline(nested_admin.NestedStackedInline):
    model = ProductStock
    extra = 1
    can_delete = False
    fields = ["quantity",
              "reserved_quantity",
              "low_stock_threshold",
              "is_available",
              ]


class StockReservationInline(nested_admin.NestedTabularInline):
    model = StockReservation
    extra = 0
    readonly_fields = ["id", "product_stock", "quantity", "status",
                       "expires_at"]
    can_delete = False
    classes = ["collapse"]


@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
    list_display = ["preview", "title", "media_type", "file", "created_at"]
    list_filter = ["media_type", "created_at"]
    search_fields = ["title", "alt_text", "file"]
    readonly_fields = ["id", "created_at", "updated_at"]

    @admin.display(description=_("Preview"))
    def preview(self, obj):
        if obj.media_type == Media.TypeChoices.IMAGE and obj.file:
            return format_html(
                '<img src="{}" style="width: 45px; height: 45px; object-fit: cover; border-radius: 4px;" />',
                obj.file.url,
            )
        return "—"


@admin.register(Category)
class CategoryAdmin(TreeAdmin):
    form = movenodeform_factory(Category)
    list_display = ["name", "slug", "is_active", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["name", "slug"]


@admin.register(Product)
class ProductAdmin(ImportExportMixin, nested_admin.NestedModelAdmin):
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

    @admin.display(description=_("Inventory on Hand (Avail / Res)"))
    def stock_status(self, obj):
        try:
            stock = obj.product_stock
            if not stock.is_available or stock.available_quantity <= 0:
                color = "red"
            elif stock.is_below_threshold():
                color = "orange"
            else:
                color = "green"

            return format_html(
                '<span style="color: {}; font-weight: bold;">{} avail</span> '
                '<span style="color: #666;">({} res / {} tot)</span>',
                color,
                stock.available_quantity,
                stock.reserved_quantity,
                stock.quantity,
            )
        except ProductStock.DoesNotExist:
            return format_html(
                '<span style="color: gray;">No stock record</span>'
            )


@admin.register(ProductStock)
class ProductStockAdmin(admin.ModelAdmin):
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

    @admin.display(description=_("Available Quantity"))
    def available_display(self, obj):
        return obj.available_quantity


@admin.register(StockReservation)
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

    @admin.display(description=_("ID"))
    def id_short(self, obj):
        return str(obj.id)[:8]

    @admin.display(description=_("Order"))
    def order_link(self, obj):
        return format_html(
            '<a href="/admin/inventory/order/{}/change/">Order #{}</a>',
            obj.order.id,
            str(obj.order.id)[:8],
        )

    @admin.display(description=_("Status"))
    def status_badge(self, obj):
        colors = {
            StockReservation.ReservationStatus.ACTIVE: "blue",
            StockReservation.ReservationStatus.COMMITTED: "green",
            StockReservation.ReservationStatus.RELEASED: "gray",
        }
        color = colors.get(obj.status, "black")
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display(),
        )

    @admin.display(boolean=True, description=_("Expired?"))
    def is_expired(self, obj):
        return timezone.now() > obj.expires_at

    @admin.action(description=_("Manually release selected active holds"))
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


@admin.register(StockTransactionLog)
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

    # Audit records are immutable
    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    @admin.display(description=_("Action"))
    def action_badge(self, obj):
        colors = {
            StockTransactionLog.ActionChoices.RESTOCK: "green",
            StockTransactionLog.ActionChoices.ORDER_DEDUCTION: "darkgreen",
            StockTransactionLog.ActionChoices.RESERVE: "blue",
            StockTransactionLog.ActionChoices.RELEASE_RESERVATION: "orange",
            StockTransactionLog.ActionChoices.ADJUSTMENT: "purple",
        }
        color = colors.get(obj.action, "black")
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_action_display(),
        )
