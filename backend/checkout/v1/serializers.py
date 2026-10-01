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


class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = [
            'code', 'name', 'description', 'icon',
            'min_amount',
        ]


class ShoppingCartItemSerializer(serializers.ModelSerializer):
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(is_active=True),
        source='product'
    )
    product_name = serializers.CharField(
        source='product.name',
        read_only=True
    )
    product_price = serializers.DecimalField(
        source='product.final_price',
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    total_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = ShoppingCartItem
        fields = ['id', 'product_id', 'product_name', 'product_price',
                  'quantity', 'total_price']


class ShoppingCartInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(
        min_value=1,
        required=True,
    )
    quantity = serializers.IntegerField(
        min_value=1,
        default=1,
    )


class ShoppingCartSerializer(serializers.ModelSerializer):
    items = ShoppingCartItemSerializer(many=True, read_only=True)
    total_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = ShoppingCart
        fields = ['id', 'items', 'total_price']


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
