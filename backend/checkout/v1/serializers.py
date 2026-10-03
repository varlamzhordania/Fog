from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from account.models import Address
from checkout.services.order import OrderService
from checkout.payments import get_provider
from inventory.models import Product
from checkout.models import (
    PaymentMethod,
    ShoppingCart,
    ShoppingCartItem,
    Order,
    OrderItem,
    OrderPayment,
    OrderShipment,
)

from account.v1.serializers import ListAddressSerializer


class CartProductSerializer(serializers.ModelSerializer):
    primary_image = serializers.SerializerMethodField()
    available_stock = serializers.IntegerField(
        source="product_stock.available_quantity",
        read_only=True,
        default=0,
    )
    is_available = serializers.BooleanField(
        source="product_stock.is_available",
        read_only=True,
        default=False,
    )
    discount_percentage = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'sku', 'product_type',
            'base_price', 'store_price', 'primary_image',
            'available_stock', 'is_available', 'discount_percentage'
        ]

    def get_primary_image(self, obj):
        image = obj.primary_image

        if image and hasattr(image, 'file') and image.file:

            relative_url = image.file.url

            request = self.context.get("request")

            if request:
                return request.build_absolute_uri(relative_url)
            return relative_url

        return None


class ShoppingCartItemSerializer(serializers.ModelSerializer):
    product = CartProductSerializer(read_only=True)

    total_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = ShoppingCartItem
        fields = ['product', 'quantity', 'total_price']


class ShoppingCartSerializer(serializers.ModelSerializer):
    items = ShoppingCartItemSerializer(many=True, read_only=True)
    total_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = ShoppingCart
        fields = ['items', 'total_price']


class ShoppingCartInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(
        min_value=1,
        required=True,
    )
    quantity = serializers.IntegerField(
        min_value=1,
        default=1,
    )


class ShoppingCartItemUpdateSerializer(serializers.Serializer):
    ACTION_CHOICES = (
        ("increment", _("increment")),
        ("decrement", _("decrement")),
        ("set", _("set")),
    )

    quantity = serializers.IntegerField(
        min_value=1,
        error_messages={
            "invalid": "Invalid quantity. Must be a positive integer.",
            "min_value": "Invalid quantity. Must be a positive integer.",
            "required": "Quantity is required.",
        }
    )
    action = serializers.ChoiceField(
        choices=ACTION_CHOICES,
        default="set",
        error_messages={
            "invalid_choice": "Invalid action. Use 'increment', 'decrement', or 'set'."
        }
    )


class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = [
            'code', 'name', 'description', 'icon',
            'min_amount',
        ]


class OrderPaymentPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderPayment
        fields = [
            'amount',
            'status',
            'provider',
            'method',
            'transaction_id',
            'paid_at',
            'created_at',
            'updated_at',
        ]


class OrderShipmentPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderShipment
        fields = [
            'tracking_number',
            'carrier',
            'status',
            'shipped_at',
            'delivered_at',
            'notes',
        ]


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()
    product_slug = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ["id", "product", "product_name", "product_slug",
                  "quantity", "unit_price", "total_price"]

    def get_product_name(self, obj):
        return obj.product.name if obj.product else None

    def get_product_slug(self, obj):
        return obj.product.slug if obj.product else None


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    delivery_address = ListAddressSerializer(many=False, read_only=True)
    payment = OrderPaymentPublicSerializer(many=False, read_only=True)
    shipment = OrderShipmentPublicSerializer(many=False, read_only=True)
    expires_at = serializers.SerializerMethodField()
    payment_instructions = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id", "delivery_address", "status", "total_price", "notes",
            "created_at", "updated_at", "expires_at", "items",
            "shipment", "payment", "payment_instructions",
        ]

    def get_expires_at(self, obj):
        return OrderService.expires_at(obj)

    def get_payment_instructions(self, obj):
        return OrderService.payment_instructions(obj)


class CheckoutAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ("full_name", "line1", "line2", "city",
                  "state", "postal_code", "country")


class OrderCreateSerializer(serializers.Serializer):
    payment_method = serializers.CharField()
    address_id = serializers.IntegerField(required=False)
    address = CheckoutAddressSerializer(required=False)
    save_address = serializers.BooleanField(default=True)
    notes = serializers.CharField(required=False, allow_blank=True, max_length=1000)

    def validate(self, attrs):
        if bool(attrs.get("address_id")) == bool(attrs.get("address")):
            raise serializers.ValidationError(
                {"address": "Choose a saved address or enter a new one."}
            )
        return attrs


class OrderPaySerializer(serializers.Serializer):
    payment_method = serializers.CharField()