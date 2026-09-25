from rest_framework import serializers

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
    converted_min_amount = serializers.SerializerMethodField()
    converted_currency = serializers.SerializerMethodField()

    class Meta:
        model = PaymentMethod
        fields = [
            'code', 'name', 'description', 'icon',
            'min_amount',
            'converted_min_amount', 'converted_currency'
        ]


class ShoppingCartItemSerializer(serializers.ModelSerializer):

    class Meta:
        model = ShoppingCartItem
        fields = ['product', 'quantity']



class ShoppingCartSerializer(serializers.ModelSerializer):
    items = ShoppingCartItemSerializer(many=True)

    class Meta:
        model = ShoppingCart
        fields = ['items']


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