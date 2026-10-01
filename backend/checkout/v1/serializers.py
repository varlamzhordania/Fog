from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

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
    """Delivers only the product fields needed for the frontend cart UI."""
    primary_image = serializers.SerializerMethodField()
    available_stock = serializers.IntegerField(read_only=True)
    discount_percentage = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'sku', 'product_type',
            'base_price', 'store_price', 'primary_image',
            'available_stock', 'discount_percentage'
        ]

    def get_primary_image(self, obj):
        image = obj.primary_image
        # Adjust this based on your Media model setup
        return image.file.url if image and hasattr(image, 'file') else None


class ShoppingCartItemSerializer(serializers.ModelSerializer):
    # Use the nested product serializer
    product = CartProductSerializer(read_only=True)

    total_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = ShoppingCartItem
        # Removed 'id' and 'product_id' -> The full product object is enough
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
    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product",
            "quantity",
            "unit_price",
            "total_price",
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    delivery_address = ListAddressSerializer(many=False, read_only=True)
    payment = OrderPaymentPublicSerializer(many=False, read_only=True)
    shipment = OrderShipmentPublicSerializer(many=False, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "delivery_address",
            "status",
            "total_price",
            "notes",
            "created_at",
            "updated_at",
            "items",
            "shipment",
            "payment",
        ]
