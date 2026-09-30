from decimal import Decimal

from rest_framework import serializers

from inventory.models import Product
from inventory.v1.serializers import MediaSerializer
from checkout.services import purchasable_quantity
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


class CartProductSerializer(serializers.ModelSerializer):
    primary_image = MediaSerializer(read_only=True)
    # Units the customer can still put in the cart (stock and per-line cap).
    available_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'slug',
            'sku',
            'product_type',
            'short_description',
            'base_price',
            'primary_image',
            'available_stock',
        ]
        read_only_fields = fields

    def get_available_stock(self, obj) -> int:
        return purchasable_quantity(obj)


class ShoppingCartItemSerializer(serializers.ModelSerializer):
    product = CartProductSerializer(read_only=True)
    unit_price = serializers.DecimalField(
        source='product.base_price',
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = ShoppingCartItem
        fields = ['id', 'product', 'quantity', 'unit_price', 'total_price']
        read_only_fields = fields

    def get_total_price(self, obj) -> str:
        return str(
            (obj.product.base_price * obj.quantity).quantize(Decimal('0.01'))
        )


class ShoppingCartSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()
    total_items = serializers.SerializerMethodField()
    total_quantity = serializers.SerializerMethodField()
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = ShoppingCart
        fields = ['items', 'total_items', 'total_quantity', 'subtotal']
        read_only_fields = fields

    def _lines(self, obj):
        # Lines of products that were deactivated after being added are hidden.
        if not hasattr(obj, '_active_lines'):
            obj._active_lines = list(
                obj.items.filter(product__is_active=True)
                .select_related('product__product_stock')
                .order_by('created_at', 'id')
            )
        return obj._active_lines

    def get_items(self, obj):
        return ShoppingCartItemSerializer(
            self._lines(obj), many=True, context=self.context
        ).data

    def get_total_items(self, obj) -> int:
        return len(self._lines(obj))

    def get_total_quantity(self, obj) -> int:
        return sum(line.quantity for line in self._lines(obj))

    def get_subtotal(self, obj) -> str:
        total = sum(
            (line.product.base_price * line.quantity for line in self._lines(obj)),
            Decimal('0.00'),
        )
        return str(total.quantize(Decimal('0.01')))


class CartItemInputSerializer(serializers.Serializer):
    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(is_active=True).select_related(
            'product_stock'
        )
    )
    # 0 removes the line. Values above the available stock are clamped.
    quantity = serializers.IntegerField(min_value=0, max_value=10000)


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