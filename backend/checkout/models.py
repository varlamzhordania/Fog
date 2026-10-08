from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.exceptions import (
    ObjectDoesNotExist,
    ValidationError as DjangoValidationError,
)
from rest_framework.exceptions import ValidationError

from core.models import BaseModel, UploadPath

User = get_user_model()


class PaymentMethod(BaseModel):
    class PaymentProviderChoices(models.TextChoices):
        MANUAL = "manual", _("Manual (staff confirmed)")
        STRIPE = "stripe", _("Stripe")
        XCASH = "xcash", _("XCash (crypto)")

    name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name=_("Name"),
        help_text=_(
            "Name of the payment method, e.g., Stripe, PayPal, crypto"
        )
    )
    code = models.CharField(
        max_length=50,
        unique=True,
        verbose_name=_("Code"),
        help_text=_("Short code identifier, e.g., stripe, paypal, crypto")
    )

    description = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Description"),
        help_text=_("Optional description for the payment method")
    )
    provider = models.CharField(
        max_length=20, choices=PaymentProviderChoices.choices,
        default=PaymentProviderChoices.MANUAL, db_index=True,
        help_text=_("Gateway that processes this method."),
    )
    asset = models.CharField(
        max_length=30, blank=True, default="",
        help_text=_(
            "Gateway symbol, e.g. BTC, XMR, ETH, TRX-USDT (SHKeeper)."
        ),
    )
    icon = models.ImageField(
        upload_to=UploadPath(folder="public", sub_path="images"),
        blank=True,
        null=True,
        verbose_name=_("Icon"),
        help_text=_("Optional for payment method icon/logo")
    )
    min_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        verbose_name=_("Minimum amount"),
        help_text=_(
            "Minimum order total required to use this payment method"
        )
    )

    class Meta:
        verbose_name = _("Payment Method")
        verbose_name_plural = _("Payment Methods")
        ordering = ['name']

    def __str__(self):
        return self.name


class ShippingMethod(BaseModel):
    name = models.CharField(max_length=100, verbose_name=_("Name"))
    code = models.SlugField(
        max_length=50, unique=True, verbose_name=_("Code"),
        help_text=_("Short identifier, e.g. standard, express."),
    )
    description = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name=_("Description")
        )
    price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
        verbose_name=_("Price (USD)"),
        help_text=_("0 makes this method free."),
    )
    free_over = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal("0.00"))],
        verbose_name=_("Free over (USD)"),
        help_text=_(
            "Shipping becomes free when the product subtotal reaches this amount. Leave empty to never discount."
            ),
    )
    min_days = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        verbose_name=_("Min. business days")
        )
    max_days = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        verbose_name=_("Max. business days")
        )
    includes_tracking = models.BooleanField(
        default=False,
        verbose_name=_("Includes tracking")
        )
    countries = models.TextField(
        blank=True, default="", verbose_name=_("Countries"),
        help_text=_(
            "Comma-separated. Empty = ships everywhere. Must match what customers enter as the country, "
            "so list the variants, e.g. US, USA, United States."
        ),
    )
    display_order = models.PositiveIntegerField(
        default=0,
        verbose_name=_("Display order")
        )

    class Meta:
        verbose_name = _("Shipping Method")
        verbose_name_plural = _("Shipping Methods")
        ordering = ["display_order", "price", "name"]

    def __str__(self):
        return self.name

    def clean(self):
        if self.min_days and self.max_days and self.min_days > self.max_days:
            raise DjangoValidationError(
                {"max_days": _("Max days must be at least the min days.")}
                )

    @property
    def country_list(self):
        return [c.strip() for c in
                self.countries.replace(";", ",").split(",") if c.strip()]

    def serves(self, country) -> bool:
        allowed = {c.lower() for c in self.country_list}
        return not allowed or (country or "").strip().lower() in allowed

    def cost_for(self, subtotal) -> Decimal:
        if self.free_over is not None and Decimal(
                subtotal
                ) >= self.free_over:
            return Decimal("0.00")
        return self.price

    @property
    def estimate(self) -> str:
        lo, hi = self.min_days, self.max_days
        if lo and hi and lo != hi:
            return f"{lo}–{hi} business days"
        days = hi or lo
        if not days:
            return ""
        return f"{days} business day{'s' if days != 1 else ''}"


class ShoppingCart(BaseModel):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='shopping_carts',
        verbose_name=_('User'),
    )

    class Meta:
        verbose_name = _('Shopping Cart')
        verbose_name_plural = _('Shopping Carts')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"Cart - User : {self.user.get_full_name()}"

    @property
    def total_price(self):
        return sum(
            item.total_price for item in self.items.filter(is_active=True)
        )


class ShoppingCartItem(BaseModel):
    cart = models.ForeignKey(
        ShoppingCart,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name=_('Shopping Cart'),
    )
    product = models.ForeignKey(
        'inventory.Product',
        on_delete=models.PROTECT,
        related_name='cart_items',
        verbose_name=_('Inventory Item'),
    )
    quantity = models.PositiveSmallIntegerField(
        verbose_name=_('Quantity'),
        help_text=_('The quantity of the item.'),
        validators=[MinValueValidator(1)],
        default=1,
    )

    class Meta:
        verbose_name = _('Shopping Cart Item')
        verbose_name_plural = _('Shopping Cart Items')
        unique_together = ('cart', 'product')
        ordering = ['cart', 'created_at']
        indexes = [
            models.Index(fields=['cart']),
            models.Index(fields=['product']),
            models.Index(
                fields=['cart', 'product', ]
            ),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.quantity}x {self.product.name}"

    @property
    def total_price(self):
        return self.product.final_price * self.quantity

    @property
    def available_stock(self) -> int:
        try:
            return self.product.product_stock.available_quantity
        except ObjectDoesNotExist:
            return 0

    def increment(self, amount=1):
        available = self.available_stock
        target = self.quantity + amount

        if target > available:
            raise ValidationError(
                {
                    "detail": f"Cannot add more. Only {available} items available in stock."
                }
            )

        self.quantity = target
        self.save(update_fields=['quantity'])

    def decrement(self, amount=1):
        available = self.available_stock
        target = max(1, self.quantity - amount)

        # If stock dropped behind the scenes, clamp down to what is actually available.
        if target > available:
            target = max(1, available)

        self.quantity = target
        self.save(update_fields=['quantity'])

    def set_quantity(self, amount=1):
        available = self.available_stock

        if amount > available:
            if amount > self.quantity:
                # The user explicitly asked for MORE than they had AND more than available
                raise ValidationError(
                    {
                        "detail": f"Only {available} items available in stock."
                    }
                )
            else:
                # The user is decreasing, but stock dropped in the background.
                # Clamp it to the available stock (minimum 1 so the item doesn't break).
                amount = max(1, available)

        self.quantity = max(1, amount)
        self.save(update_fields=['quantity'])


class Order(BaseModel):
    class StatusChoices(models.TextChoices):
        PAYMENT = 'payment', _('Payment')
        PENDING = 'pending', _('Pending')
        PROCESSING = 'processing', _('Processing')
        SHIPPED = 'shipped', _('Shipped')
        DELIVERED = 'delivered', _('Delivered')
        CANCELLED = 'cancelled', _('Cancelled')

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='orders',
        verbose_name=_('Customer'),
    )
    delivery_address = models.ForeignKey(
        "account.Address",
        on_delete=models.PROTECT,
        related_name='orders',
        verbose_name=_('Delivery Address'),
    )
    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.PAYMENT,
        verbose_name=_('Status'),
    )
    total_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name=_('Total Price'),
    )
    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name=_('Subtotal'),
        help_text=_('Sum of product prices before tax.'),
    )
    tax_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        verbose_name=_('Tax'),
    )
    tax_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0.00"),
        verbose_name=_('Tax rate (%)'),
    )
    tax_name = models.CharField(
        max_length=30,
        blank=True,
        default="",
        verbose_name=_('Tax name')
    )
    tax_included = models.BooleanField(
        default=False,
        verbose_name=_('Prices included tax')
    )
    shipping_method = models.ForeignKey(
        ShippingMethod, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="orders", verbose_name=_("Shipping method"),
    )
    shipping_method_name = models.CharField(
        max_length=100,
        blank=True,
        default="",
        verbose_name=_("Shipping method name")
        )
    shipping_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        verbose_name=_("Shipping cost"),
    )
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name=_('Notes'),
    )

    class Meta:
        verbose_name = _('Order')
        verbose_name_plural = _('Orders')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"Order #{self.id} - {self.user.get_full_name()}"


class OrderItem(BaseModel):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name=_('Order'),
    )
    product = models.ForeignKey(
        'inventory.Product',
        on_delete=models.PROTECT,
        null=True,
        related_name='order_items',
        verbose_name=_('Product'),
    )
    quantity = models.PositiveSmallIntegerField(
        verbose_name=_('Quantity'),
        validators=[MinValueValidator(1)],
        default=1,
    )
    unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name=_('Unit Price'),
    )
    total_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name=_('Total Price'),
    )

    class Meta:
        verbose_name = _('Order Item')
        verbose_name_plural = _('Order Items')
        ordering = ['order']
        indexes = [
            models.Index(fields=['order']),
            models.Index(fields=['product']),
        ]

    def __str__(self):
        return f"{self.product} x {self.quantity}"


class OrderShipment(BaseModel):
    class StatusChoices(models.TextChoices):
        PENDING = 'pending', _('Pending')
        IN_TRANSIT = 'in_transit', _('In Transit')
        DELIVERED = 'delivered', _('Delivered')

    order = models.OneToOneField(
        Order,
        on_delete=models.CASCADE,
        related_name='shipment',
        verbose_name=_('Order'),
    )
    tracking_number = models.CharField(
        verbose_name=_("Tracking Number"),
        max_length=100,
        blank=True,
        null=True,
        help_text=_("Tracking number provided by the carrier."),
    )
    carrier = models.CharField(
        verbose_name=_("Carrier"),
        max_length=100,
        blank=True,
        null=True,
        help_text=_("Shipping carrier or provider name."),
    )
    status = models.CharField(
        verbose_name=_("Status"),
        max_length=50,
        choices=StatusChoices.choices,
        default=StatusChoices.PENDING,
        db_index=True,
    )
    shipped_at = models.DateTimeField(
        verbose_name=_("Shipped At"),
        blank=True,
        null=True,
        db_index=True,
    )
    delivered_at = models.DateTimeField(
        verbose_name=_("Delivered At"),
        blank=True,
        null=True,
        db_index=True,
    )
    notes = models.TextField(
        verbose_name=_("Notes"),
        blank=True,
        null=True,
        help_text=_("Optional notes or instructions for the shipment."),
    )

    class Meta:
        verbose_name = _('Order Shipment')
        verbose_name_plural = _('Order Shipments')
        indexes = [
            models.Index(fields=['order']),
            models.Index(fields=['status']),
            models.Index(fields=['carrier']),
            models.Index(fields=['shipped_at']),
            models.Index(fields=['delivered_at']),
        ]
        ordering = ['-shipped_at', '-delivered_at']

    def __str__(self):
        return f"Shipment for Order #{self.order.id} ({self.get_status_display()})"

    @property
    def is_shipped(self) -> bool:
        return self.status in [self.StatusChoices.IN_TRANSIT,
                               self.StatusChoices.DELIVERED]

    @property
    def is_delivered(self) -> bool:
        return self.status == self.StatusChoices.DELIVERED

    def mark_shipped(
            self,
            tracking_number: str = None,
            carrier: str = None,
            notes: str = None
    ):
        self.status = self.StatusChoices.IN_TRANSIT
        self.shipped_at = timezone.now()
        if tracking_number:
            self.tracking_number = tracking_number
        if carrier:
            self.carrier = carrier
        if notes:
            self.notes = notes
        self.save(
            update_fields=['status', 'shipped_at', 'tracking_number',
                           'carrier', 'notes']
        )

    def mark_delivered(self, notes: str = None):
        self.status = self.StatusChoices.DELIVERED
        self.delivered_at = timezone.now()
        if notes:
            self.notes = notes
        self.save(update_fields=['status', 'delivered_at', 'notes'])


class OrderPayment(BaseModel):
    class StatusChoices(models.TextChoices):
        PENDING = 'PENDING', _('Pending')
        COMPLETED = 'COMPLETED', _('Completed')
        FAILED = 'FAILED', _('Failed')
        REFUNDED = 'REFUNDED', _('Refunded')

    order = models.OneToOneField(
        Order,
        on_delete=models.CASCADE,
        related_name='payment',
        verbose_name=_('Order'),
    )
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name=_('Amount'),
    )
    status = models.CharField(
        max_length=20,
        choices=StatusChoices.choices,
        default=StatusChoices.PENDING,
        verbose_name=_('Status'),
    )
    provider = models.CharField(
        max_length=20,
        choices=PaymentMethod.PaymentProviderChoices.choices,
        default=PaymentMethod.PaymentProviderChoices.MANUAL,
        db_index=True,
        verbose_name=_("Provider"),
    )
    provider_reference = models.CharField(
        max_length=128, blank=True, default="", db_index=True,
        help_text=_("Stripe session id / SHKeeper external id."),
    )
    method = models.CharField(
        max_length=50,
        verbose_name=_('Payment Method'),
        help_text=_('e.g. Stripe, Crypto, PayPal'),
    )
    method_code = models.CharField(max_length=50, blank=True, default="")
    provider_data = models.JSONField(default=dict, blank=True)
    transaction_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name=_('Transaction ID'),
        help_text=_('Unique ID returned by payment gateway'),
        db_index=True,
        unique=True,
    )
    paid_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name=_('Paid At'),
        help_text=_('Timestamp when payment was confirmed'),
    )

    class Meta:
        verbose_name = _('Order Payment')
        verbose_name_plural = _('Orders Payments')
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment for Order #{self.order.id} - {self.get_status_display()}"

    def mark_completed(self, transaction_id=None):
        self.status = self.StatusChoices.COMPLETED
        if transaction_id:
            self.transaction_id = transaction_id
        self.paid_at = timezone.now()
        self.save(update_fields=['status', 'transaction_id', 'paid_at'])

    def mark_failed(self, transaction_id=None):
        self.status = self.StatusChoices.FAILED
        if transaction_id:
            self.transaction_id = transaction_id
        self.save(update_fields=['status', 'transaction_id'])

    def is_paid(self):
        return self.status == self.StatusChoices.COMPLETED and self.paid_at is not None


class PaymentAttempt(BaseModel):
    class StatusChoices(models.TextChoices):
        INITIATED = "initiated", _("Initiated")
        PENDING = "pending", _("Awaiting payment")
        SUCCEEDED = "succeeded", _("Succeeded")
        FAILED = "failed", _("Failed to start")
        EXPIRED = "expired", _("Expired")
        CANCELLED = "cancelled", _("Cancelled")
        SUPERSEDED = "superseded", _("Replaced by a newer attempt")
        LATE = "late", _("Paid after the order closed")
        REFUNDED = "refunded", _("Refunded")

    payment = models.ForeignKey(
        OrderPayment,
        on_delete=models.CASCADE,
        related_name="attempts"
    )
    number = models.PositiveSmallIntegerField(default=1)
    provider = models.CharField(
        max_length=20,
        choices=PaymentMethod.PaymentProviderChoices.choices
    )
    method = models.CharField(max_length=50)
    method_code = models.CharField(max_length=50, blank=True, default="")
    asset = models.CharField(max_length=30, blank=True, default="")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(
        max_length=20, choices=StatusChoices.choices,
        default=StatusChoices.INITIATED, db_index=True
    )
    provider_reference = models.CharField(
        max_length=128,
        blank=True,
        default="",
        db_index=True
    )
    provider_data = models.JSONField(default=dict, blank=True)
    transaction_id = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )
    error = models.TextField(blank=True, default="")
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-number"]
        unique_together = ("payment", "number")

    def __str__(self):
        return f"Order #{self.payment.order_id} attempt {self.number} ({self.method}, {self.status})"


class OrderNotification(BaseModel):
    class Audience(models.TextChoices):
        CUSTOMER = "customer", _("Customer")
        ADMIN = "admin", _("Admin")

    class Status(models.TextChoices):
        PENDING = "pending", _("Pending")
        SENT = "sent", _("Sent")
        FAILED = "failed", _("Failed")
        SKIPPED = "skipped", _("Skipped")

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="notifications"
    )
    event = models.CharField(max_length=40)
    audience = models.CharField(max_length=10, choices=Audience.choices)
    recipients = models.TextField(blank=True, default="")
    subject = models.CharField(max_length=255, blank=True, default="")
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING
    )
    error = models.TextField(blank=True, default="")
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("order", "event", "audience")
        ordering = ["-created_at"]
