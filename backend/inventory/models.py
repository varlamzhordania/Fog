import uuid
from decimal import Decimal
from datetime import timedelta

from django.db import models, transaction
from django.db.models import F
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator
from django.contrib.auth import get_user_model
from django_ckeditor_5.fields import CKEditor5Field
from treebeard.mp_tree import MP_Node
from autoslug import AutoSlugField

from core.models import BaseModel, UploadPath, FileSizeValidator

User = get_user_model()


class Media(BaseModel):
    class TypeChoices(models.TextChoices):
        IMAGE = "IMAGE", _("Image")
        VIDEO = "VIDEO", _("Video")
        DOCUMENT = "DOCUMENT", _("Document / Certificate")
        OTHER = "OTHER", _("Other")

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
        )
    file = models.FileField(
        upload_to=UploadPath("upload", "file"),
        validators=[FileSizeValidator(max_size_mb=15)],
        verbose_name=_("File"),
    )
    media_type = models.CharField(
        max_length=20,
        choices=TypeChoices.choices,
        default=TypeChoices.IMAGE,
        verbose_name=_("Media Type"),
        db_index=True,
    )
    title = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name=_("Title / Label"),
    )
    alt_text = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name=_("Alt Text"),
        help_text=_("Accessibility and SEO description for images."),
    )

    class Meta:
        verbose_name = _("Media Asset")
        verbose_name_plural = _("Media Assets")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["media_type"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return self.title or self.file.name or f"Media #{self.id}"


class Category(MP_Node, BaseModel):
    name = models.CharField(
        max_length=100,
        verbose_name=_("Category Name"),
    )
    slug = AutoSlugField(
        populate_from="name",
        max_length=120,
        unique=True,
        blank=True,
        allow_unicode=True,
        editable=False,
        always_update=False,
        verbose_name=_("Slug"),
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Description"),
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Active"),
        help_text=_(
            "Disabling hides this category and its descendants from the storefront."
        ),
    )

    node_order_by = ["name"]

    class Meta:
        verbose_name = _("Category")
        verbose_name_plural = _("Categories")
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return self.get_breadcrumb()

    def get_breadcrumb(self) -> str:
        """Returns the full hierarchical category chain (e.g. Cultivation > Substrates > Grains)."""
        ancestors = list(
            self.get_ancestors().values_list("name", flat=True)
            )
        ancestors.append(self.name)
        return " > ".join(ancestors)


class Product(BaseModel):
    class ProductType(models.TextChoices):
        SPORE_SYRINGE = "spore_syringe", _("Spore Syringe (10ml)")
        SPORE_PRINT = "spore_print", _("Spore Print")
        LIQUID_CULTURE = "liquid_culture", _("Liquid Culture (Isolated)")
        AGAR_CULTURE = "agar_culture", _("Agar Plate / Slant")
        SUBSTRATE = "substrate", _("Sterilized Grain / Substrate")
        EQUIPMENT = "equipment", _("Lab & Cultivation Equipment")
        OTHER = "other", _("Other")

    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
        verbose_name=_("Category"),
    )
    name = models.CharField(max_length=255, verbose_name=_("Product Name"))
    slug = AutoSlugField(
        populate_from="name",
        max_length=255,
        unique=True,
        blank=True,
        allow_unicode=True,
        editable=False,
        always_update=False,
        verbose_name=_("Slug"),
    )
    sku = models.CharField(
        max_length=64,
        unique=True,
        verbose_name=_("SKU"),
    )
    product_type = models.CharField(
        max_length=30,
        choices=ProductType.choices,
        default=ProductType.SPORE_SYRINGE,
        verbose_name=_("Product Type"),
    )
    short_description = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name=_("Short Summary"),
    )
    description = CKEditor5Field(
        config_name="admin",
        blank=True,
        null=True,
        verbose_name=_("Full Description"),
    )
    base_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
        verbose_name=_("Base Price (USD)"),
        help_text=_(
            "Authoritative baseline fiat price used during checkout conversion."
        ),
    )
    media = models.ManyToManyField(
        Media,
        through="ProductMedia",
        related_name="products",
        blank=True,
        verbose_name=_("Product Media"),
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Active in Store"),
    )
    is_featured = models.BooleanField(
        default=False,
        verbose_name=_("Featured Item"),
    )

    class Meta:
        verbose_name = _("Product")
        verbose_name_plural = _("Products")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["sku"]),
            models.Index(fields=["product_type"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.sku})"

    @property
    def primary_image(self) -> Media | None:
        """Returns the marked thumbnail or the first associated image file."""
        featured = self.product_media_items.filter(
            is_featured=True,
            media__media_type=Media.TypeChoices.IMAGE,
        ).select_related("media").first()

        if featured:
            return featured.media

        first = self.product_media_items.filter(
            media__media_type=Media.TypeChoices.IMAGE,
        ).select_related("media").first()

        return first.media if first else None


class ProductMedia(BaseModel):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="product_media_items",
        verbose_name=_("Product"),
    )
    media = models.ForeignKey(
        Media,
        on_delete=models.CASCADE,
        related_name="product_media_items",
        verbose_name=_("Media Asset"),
    )
    is_featured = models.BooleanField(
        default=False,
        verbose_name=_("Featured Thumbnail"),
        help_text=_("Sets this asset as the main product image."),
    )
    display_order = models.PositiveIntegerField(
        default=0,
        verbose_name=_("Display Order"),
        help_text=_(
            "Determines gallery sorting (lower numbers display first)."
            ),
    )

    class Meta:
        verbose_name = _("Product Media Association")
        verbose_name_plural = _("Product Media Associations")
        ordering = ["display_order", "-created_at"]
        unique_together = ("product", "media")
        indexes = [
            models.Index(fields=["product", "is_featured"]),
            models.Index(fields=["product", "display_order"]),
        ]

    def __str__(self):
        return f"{self.product.name} ↔ {self.media}"


class ProductStock(BaseModel):
    product = models.OneToOneField(
        Product,
        on_delete=models.CASCADE,
        related_name="product_stock",
        verbose_name=_("Product"),
    )
    quantity = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name=_("Stock Quantity on Hand"),
    )
    reserved_quantity = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name=_("Reserved Stock"),
        help_text=_(
            "Locked stock during active 60-minute payment windows."
            ),
    )
    is_available = models.BooleanField(
        default=True,
        verbose_name=_("Available for Purchase"),
    )
    low_stock_threshold = models.PositiveIntegerField(
        default=5,
        validators=[MinValueValidator(0)],
        verbose_name=_("Low Stock Alert Threshold"),
    )

    class Meta:
        verbose_name = _("Product Stock")
        verbose_name_plural = _("Product Stocks")
        indexes = [
            models.Index(fields=["is_available"]),
        ]

    def __str__(self):
        return f"{self.product.name}: {self.quantity} on hand ({self.reserved_quantity} locked)"

    @property
    def available_quantity(self) -> int:
        """Physical stock minus units locked in pending cryptocurrency payments."""
        return max(0, self.quantity - self.reserved_quantity)

    def is_below_threshold(self) -> bool:
        return self.available_quantity <= self.low_stock_threshold


class StockReservation(BaseModel):
    """
    Temporarily locks inventory units for an order during the 60-minute crypto payment window.
    Releases automatically via Celery beat if the deposit address is unfunded upon expiration.
    """

    class ReservationStatus(models.TextChoices):
        ACTIVE = "active", _("Active Hold")
        COMMITTED = "committed", _("Committed (Paid)")
        RELEASED = "released", _("Released (Expired / Cancelled)")

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    order = models.ForeignKey(
        "inventory.Order",
        on_delete=models.CASCADE,
        related_name="stock_reservations",
        verbose_name=_("Order"),
    )
    product_stock = models.ForeignKey(
        ProductStock,
        on_delete=models.CASCADE,
        related_name="reservations",
        verbose_name=_("Product Stock"),
    )
    quantity = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        verbose_name=_("Reserved Quantity"),
    )
    status = models.CharField(
        max_length=20,
        choices=ReservationStatus.choices,
        default=ReservationStatus.ACTIVE,
        db_index=True,
    )
    expires_at = models.DateTimeField(
        db_index=True,
        verbose_name=_("Reservation Expiry"),
    )

    class Meta:
        verbose_name = _("Stock Reservation")
        verbose_name_plural = _("Stock Reservations")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["order", "status"]),
            models.Index(fields=["expires_at", "status"]),
        ]

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=60)
        super().save(*args, **kwargs)

    @transaction.atomic
    def release(self, reason: str = "Crypto payment window expired"):
        """Releases locked stock back to general availability."""
        if self.status != self.ReservationStatus.ACTIVE:
            return

        ProductStock.objects.filter(id=self.product_stock_id).update(
            reserved_quantity=F("reserved_quantity") - self.quantity
        )
        self.status = self.ReservationStatus.RELEASED
        self.save(update_fields=["status", "updated_at"])

        StockTransactionLog.objects.create(
            product_stock=self.product_stock,
            action=StockTransactionLog.ActionChoices.RELEASE_RESERVATION,
            quantity=self.quantity,
            note=f"Reservation {self.id} released: {reason}",
        )

    @transaction.atomic
    def commit(self):
        """Deducts stock permanently once the cryptocurrency transaction is confirmed."""
        if self.status != self.ReservationStatus.ACTIVE:
            return

        ProductStock.objects.filter(id=self.product_stock_id).update(
            quantity=F("quantity") - self.quantity,
            reserved_quantity=F("reserved_quantity") - self.quantity,
        )
        self.status = self.ReservationStatus.COMMITTED
        self.save(update_fields=["status", "updated_at"])

        StockTransactionLog.objects.create(
            product_stock=self.product_stock,
            action=StockTransactionLog.ActionChoices.ORDER_DEDUCTION,
            quantity=self.quantity,
            note=f"Reservation {self.id} committed for Order #{self.order.id}",
        )


class StockTransactionLog(BaseModel):
    class ActionChoices(models.TextChoices):
        RESTOCK = "restock", _("Restocked (Inbound)")
        ORDER_DEDUCTION = "order_deduction", _(
            "Order Confirmed (Deducted)"
            )
        RESERVE = "reserve", _("Reserved (Pending Payment)")
        RELEASE_RESERVATION = "release_reservation", _(
            "Released Reservation"
            )
        ADJUSTMENT = "adjustment", _("Manual Stock Adjustment")

    product_stock = models.ForeignKey(
        ProductStock,
        on_delete=models.CASCADE,
        related_name="transactions",
        verbose_name=_("Product Stock"),
    )
    action = models.CharField(
        max_length=30,
        choices=ActionChoices.choices,
        default=ActionChoices.ADJUSTMENT,
        verbose_name=_("Action"),
    )
    quantity = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        verbose_name=_("Quantity Changed"),
    )
    performed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_("Performed By"),
        help_text=_(
            "Null for automated crypto reservation and expiration events."
            ),
    )
    note = models.TextField(blank=True, null=True, verbose_name=_("Notes"))

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("Stock Transaction Log")
        verbose_name_plural = _("Stock Transaction Logs")
        indexes = [
            models.Index(fields=["product_stock"]),
            models.Index(fields=["action"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"{self.get_action_display()} ({self.quantity}) - {self.product_stock.product.name}"


