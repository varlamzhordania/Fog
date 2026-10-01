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


class ShoppingCartProductSerializer(serializers.ModelSerializer):
    primary_image = serializers.SerializerMethodField()
    available_stock = serializers.SerializerMethodField()
    discount_percentage = serializers.IntegerField(
        read_only=True
    )

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "product_type",
            "primary_image",
            "available_stock",
            "base_price",
            "store_price",
            "discount_percentage",
        ]

    def get_primary_image(self, obj):
        image = obj.primary_image

        if not image:
            return None

        request = self.context.get("request")

        if request:
            return request.build_absolute_uri(
                image.file.url
            )

        return image.file.url

    def get_available_stock(self, obj):
        if not hasattr(obj, "product_stock"):
            return 0

        return obj.product_stock.available_quantity


class ShoppingCartItemSerializer(serializers.ModelSerializer):
    product = ShoppingCartProductSerializer(
        read_only=True
    )

    total_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = ShoppingCartItem
        fields = [
            "id",
            "product",
            "quantity",
            "total_price",
        ]


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
    items = ShoppingCartItemSerializer(
        many=True,
        read_only=True,
    )

    total_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = ShoppingCart
        fields = [
            "id",
            "items",
            "total_price",
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
