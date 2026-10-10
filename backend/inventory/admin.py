import nested_admin
from django.contrib import admin as django_admin
from django.urls import NoReverseMatch, reverse
from django.utils import timezone
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from treebeard.admin import TreeAdmin
from treebeard.forms import movenodeform_factory
from unfold import admin
from simple_history.admin import SimpleHistoryAdmin

from core.admin import UnfoldImportExportHistoryAdmin
from inventory.services.stock import StockService

from .models import (
    Category,
    Tag,
    Media,
    Product,
    ProductMedia,
    ProductPrice,
    ProductStock,
    StockReservation,
    StockTransactionLog, ProductReview,
)
from .resources import (
    ProductResource, ProductStockResource, TagResource,
    CategoryResource,
)


class ProductMediaInline(
    admin.StackedInline,
    nested_admin.NestedTabularInline
):
    model = ProductMedia
    extra = 0
    fields = [
        "media",
        "preview",
        "is_featured",
        "display_order",
    ]
    readonly_fields = ["preview"]
    classes = ["collapse"]

    @admin.display(description="Preview")
    def preview(self, obj):
        if not obj.pk or not obj.media or not obj.media.file:
            return "—"

        media = obj.media
        url = media.file.url

        if media.media_type == Media.TypeChoices.IMAGE:
            return format_html(
                '<a href="{}" target="_blank">'
                '<img src="{}" '
                'style="width:120px;height:90px;object-fit:cover;'
                'border-radius:8px;border:1px solid #ddd;" />'
                "</a>",
                url,
                url,
            )

        if media.media_type == Media.TypeChoices.VIDEO:
            return format_html(
                '<video controls '
                'style="width:180px;max-height:120px;border-radius:8px;">'
                '<source src="{}">'
                "Your browser does not support video."
                "</video>",
                url,
            )

        if media.media_type == Media.TypeChoices.DOCUMENT:
            return format_html(
                '<a href="{}" target="_blank">📄 Open document</a>',
                url,
            )

        return format_html(
            '<a href="{}" target="_blank">🔗 Open file</a>',
            url,
        )


class ProductPriceInline(admin.TabularInline, nested_admin.NestedTabularInline):
    model = ProductPrice
    extra = 0
    min_num = 1
    validate_min = True
    fields = ["label", "stock_quantity", "base_price", "store_price",
              "is_default", "display_order", "is_active"]


class MediaInline(admin.StackedInline):
    model = Media
    extra = 1
    fields = ["file", "media_type", "title", "alt_text"]


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
        if obj.expires_at:
            return timezone.now() > obj.expires_at
        return False


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
    readonly_fields = ["reserved_quantity"]


@django_admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
    list_display = [
        "preview",
        "title",
        "media_type",
        "file",
        "is_active",
        "created_at",
    ]
    list_filter = ["media_type", "is_active", "created_at"]
    search_fields = ["title", "alt_text", "file"]

    readonly_fields = [
        "id",
        "created_at",
        "updated_at",
        "preview",
    ]

    fieldsets = (
        (
            _("Media"),
            {
                "fields": (
                    "file",
                    "media_type",
                    "preview",
                ),
            },
        ),
        (
            _("Metadata"),
            {
                "fields": (
                    "title",
                    "alt_text",
                ),
            },
        ),
        (
            _("Status"),
            {
                "fields": (
                    "is_active",
                ),
            },
        ),
        (
            _("System Information"),
            {
                "classes": ("collapse",),
                "fields": (
                    "id",
                    "created_at",
                    "updated_at",
                ),
            },
        ),
    )

    @django_admin.display(description=_("Preview"))
    def preview(self, obj):
        if (
                obj
                and obj.media_type == Media.TypeChoices.IMAGE
                and obj.file
        ):
            return format_html(
                '<img src="{}" class="w-24 h-24 aspect-auto object-cover rounded-lg" />',
                obj.file.url,
            )

        return "—"


@django_admin.register(Category)
class CategoryAdmin(UnfoldImportExportHistoryAdmin, TreeAdmin):
    form = movenodeform_factory(Category)
    resource_classes = [CategoryResource]
    list_display = ["name", "slug", "is_featured", "is_filterable",
                    "is_active", "created_at"]
    list_filter = ["is_active", "is_filterable", "is_featured"]
    search_fields = ["name", "slug"]
    readonly_fields = ["slug"]
    list_per_page = 100


@django_admin.register(Tag)
class TagAdmin(UnfoldImportExportHistoryAdmin):
    resource_classes = [TagResource]
    list_display = ["name", "slug", "is_filterable",
                    "is_active", "created_at"]
    list_filter = ["is_active", "is_filterable", ]
    search_fields = ["name", "slug"]


@django_admin.register(Product)
class ProductAdmin(
    UnfoldImportExportHistoryAdmin,
    nested_admin.NestedModelAdmin,
):
    resource_classes = [ProductResource]
    inlines = [ProductPriceInline, ProductStockInline, ProductMediaInline]

    list_display = [
        "name",
        "sku",
        "category",
        "product_type",
        "base_price",
        "store_price",
        "discount_display",
        "stock_status",
        "is_active",
        "is_featured",
    ]

    list_filter = [
        "product_type",
        "is_active",
        "is_featured",
        "category",
    ]

    search_fields = [
        "name",
        "sku",
        "slug",
    ]

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
                    "tags",
                    "product_type",
                ),
            },
        ),
        (
            _("Pricing"),
            {
                "fields": ("stock_unit", ("base_price", "store_price")),
                "description": _(
                    "Prices are set per option in the Product Prices table below. "
                    "The figures here show the cheapest option and update automatically."
                ),
            },
        ),
        (
            _("Descriptions"),
            {
                "fields": (
                    "short_description",
                    "description",
                ),
            },
        ),
        (
            _("Store Visibility"),
            {
                "fields": (
                    ("is_active", "is_featured"),
                ),
            },
        ),
    ]

    readonly_fields = ["id", "slug", "base_price", "store_price", "created_at",
                       "updated_at"]

    @django_admin.display(
        description=_("Discount"),
        ordering="store_price",
    )
    def discount_display(self, obj):
        discount = obj.discount_percentage

        if discount <= 0:
            return format_html(
                '<span class="text-xs text-gray-400">—</span>', {}
            )

        return format_html(
            '<span class="inline-flex items-center px-2 py-0.5 '
            'rounded text-xs font-semibold '
            'bg-red-50 text-red-700 '
            'dark:bg-red-950 dark:text-red-300">'
            '{}% OFF'
            '</span>',
            discount,
        )

    @django_admin.display(description=_("Inventory on Hand (Avail / Res)"))
    def stock_status(self, obj):
        try:
            stock = obj.product_stock

            if not stock.is_available or stock.available_quantity <= 0:
                badge_class = (
                    "bg-red-50 text-red-700 "
                    "dark:bg-red-950 dark:text-red-300"
                )
            elif stock.is_below_threshold():
                badge_class = (
                    "bg-amber-50 text-amber-700 "
                    "dark:bg-amber-950 dark:text-amber-300"
                )
            else:
                badge_class = (
                    "bg-emerald-50 text-emerald-700 "
                    "dark:bg-emerald-950 dark:text-emerald-300"
                )

            return format_html(
                '<span class="inline-flex items-center px-2 py-0.5 '
                'rounded text-xs font-semibold {}">'
                '{} avail '
                '<span class="ml-1 opacity-70">'
                '({} res / {} tot)'
                '</span>'
                '</span>',
                badge_class,
                stock.available_quantity,
                stock.reserved_quantity,
                stock.quantity,
            )

        except ProductStock.DoesNotExist:
            return format_html(
                '<span class="text-xs text-gray-400">'
                'No stock record'
                '</span>', {}
            )


@django_admin.register(ProductReview)
class ProductReviewAdmin(SimpleHistoryAdmin, admin.ModelAdmin):
    list_display = ["product", "user", "rating", "short_comment", "is_active",
                    "created_at"]
    list_filter = ["rating", "is_active", "created_at"]
    search_fields = ["product__name", "user__email", "comment"]
    readonly_fields = ["product", "user", "rating", "comment", "created_at",
                       "updated_at"]
    actions = ["hide_reviews", "show_reviews"]

    def has_add_permission(self, request):
        return False

    @django_admin.display(description=_("Comment"))
    def short_comment(self, obj):
        return (obj.comment[:60] + "…") if len(
            obj.comment
        ) > 60 else obj.comment or "—"

    def _toggle(self, request, queryset, value):
        for review in queryset:  # save() so the rating stats refresh
            review.is_active = value
            review.save(update_fields=["is_active", "updated_at"])
        self.message_user(request, f"Updated {queryset.count()} review(s).")

    @django_admin.action(description=_("Hide selected reviews"))
    def hide_reviews(self, request, queryset):
        self._toggle(request, queryset, False)

    @django_admin.action(description=_("Show selected reviews"))
    def show_reviews(self, request, queryset):
        self._toggle(request, queryset, True)


@django_admin.register(ProductStock)
class ProductStockAdmin(UnfoldImportExportHistoryAdmin):
    inlines = [StockReservationInline]
    resource_classes = [ProductStockResource]
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
class StockReservationAdmin(SimpleHistoryAdmin, admin.ModelAdmin):
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
        released = sum(
            StockService.release(
                hold,
                f"Manually released by {request.user.email}"
            )
            for hold in queryset.select_related("product_stock")
        )
        self.message_user(
            request,
            f"Released {released} stock reservation(s)."
        )


@django_admin.register(StockTransactionLog)
class StockTransactionLogAdmin(SimpleHistoryAdmin, admin.ModelAdmin):
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
