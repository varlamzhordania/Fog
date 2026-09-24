import uuid
from decimal import Decimal
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator

from core.models import BaseModel
from inventory.models import Product

User = get_user_model()

class Order(BaseModel):
    class StatusChoices(models.TextChoices):
        PENDING_PAYMENT = "pending_payment", _("Pending Crypto Payment")
        PAYMENT_DETECTED = "payment_detected", _(
            "Payment Detected (Awaiting Confirmations)"
        )
        PAID = "paid", _("Payment Confirmed")
        PROCESSING = "processing", _("Processing / Packing")
        SHIPPED = "shipped", _("Shipped")
        DELIVERED = "delivered", _("Delivered")
        EXPIRED = "expired", _("Expired (Window Elapsed)")
        CANCELLED = "cancelled", _("Cancelled")

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    order_token = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
        db_index=True,
        help_text=_(
            "Secret token allowing anonymous buyers to poll status without logging in."
        ),
    )
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
        verbose_name=_("Customer (Optional)"),
    )
    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
        verbose_name=_("Total Amount (USD)"),
    )
    status = models.CharField(
        max_length=32,
        choices=StatusChoices.choices,
        default=StatusChoices.PENDING_PAYMENT,
        db_index=True,
        verbose_name=_("Order Status"),
    )
    encrypted_shipping_address = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Encrypted Shipping Address / PGP"),
        help_text=_(
            "Client-side PGP encrypted delivery address or server encrypted payload."
        ),
    )
    customer_notes = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Customer Notes"),
    )

    class Meta:
        verbose_name = _("Order")
        verbose_name_plural = _("Orders")
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["order_token"]),
            models.Index(fields=["status"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"Order #{self.id} [{self.get_status_display()}]"


class OrderItem(BaseModel):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
        verbose_name=_("Order"),
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="order_items",
        verbose_name=_("Product"),
    )
    quantity = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        verbose_name=_("Quantity"),
    )
    unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name=_("Unit Price (USD)"),
    )
    total_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name=_("Total Price (USD)"),
    )

    class Meta:
        verbose_name = _("Order Item")
        verbose_name_plural = _("Order Items")
        ordering = ["order", "created_at"]
        indexes = [
            models.Index(fields=["order"]),
            models.Index(fields=["product"]),
        ]

    def __str__(self):
        return f"{self.quantity}x {self.product.name}"


class Shipment(BaseModel):
    class StatusChoices(models.TextChoices):
        PREPARING = "preparing", _("Preparing Stealth Packaging")
        DISPATCHED = "dispatched", _("Dispatched / In Transit")
        DELIVERED = "delivered", _("Delivered")
        FAILED = "failed", _("Delivery Failed / Returned")

    order = models.OneToOneField(
        Order,
        on_delete=models.CASCADE,
        related_name="shipment",
        verbose_name=_("Order"),
    )
    carrier = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name=_("Carrier"),
    )
    tracking_number = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name=_("Tracking Identifier"),
    )
    status = models.CharField(
        max_length=30,
        choices=StatusChoices.choices,
        default=StatusChoices.PREPARING,
        verbose_name=_("Shipment Status"),
    )
    dispatched_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name=_("Dispatched At"),
    )
    delivered_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name=_("Delivered At"),
    )

    class Meta:
        verbose_name = _("Shipment")
        verbose_name_plural = _("Shipments")
        indexes = [
            models.Index(fields=["order"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"Shipment for Order #{self.order.id} ({self.get_status_display()})"
