import logging

from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework import status
from drf_spectacular.utils import extend_schema

from django.shortcuts import get_object_or_404

from checkout.models import (
    PaymentMethod,
    ShoppingCart,
    Order,
)
from checkout.services import clear_cart, set_item_quantity, set_items

from inventory.models import Product

from .serializers import (
    CartItemInputSerializer,
    ShoppingCartSerializer,
    PaymentMethodSerializer,
    OrderSerializer,
)

logger = logging.getLogger("fog")


@extend_schema(tags=["Checkout"])
class PaymentMethodListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = PaymentMethod.objects.filter(is_active=True)
    serializer_class = PaymentMethodSerializer
    pagination_class = None


def serialize_cart(request: Request, cart: ShoppingCart) -> Response:
    # Re-read the cart so the response reflects what was actually stored.
    cart = ShoppingCart.objects.get(pk=cart.pk)
    return Response(
        ShoppingCartSerializer(cart, context={"request": request}).data,
        status=status.HTTP_200_OK,
    )


@extend_schema(tags=["Checkout"])
class ShoppingCartView(APIView):
    """
    The authenticated user's shopping cart.

    GET     returns the cart.
    POST    sets quantities for a list of {product, quantity} lines (used to
            merge a guest cart after login). Quantity 0 removes the line.
    DELETE  empties the cart.

    Every response is the full, up to date cart.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ShoppingCartSerializer

    def get(self, request: Request, *args, **kwargs) -> Response:
        cart, _ = ShoppingCart.objects.get_or_create(user=request.user)
        return serialize_cart(request, cart)

    @extend_schema(request=CartItemInputSerializer(many=True))
    def post(self, request: Request, *args, **kwargs) -> Response:
        data = request.data
        if isinstance(data, dict):
            data = [data]

        if not isinstance(data, list) or not data:
            return Response(
                {"detail": "No items provided."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CartItemInputSerializer(data=data, many=True)
        serializer.is_valid(raise_exception=True)

        cart, _ = ShoppingCart.objects.get_or_create(user=request.user)
        set_items(
            cart,
            [
                (line["product"], line["quantity"])
                for line in serializer.validated_data
            ],
        )

        return serialize_cart(request, cart)

    def delete(self, request: Request, *args, **kwargs) -> Response:
        cart, _ = ShoppingCart.objects.get_or_create(user=request.user)
        clear_cart(cart)
        return serialize_cart(request, cart)


@extend_schema(tags=["Checkout"])
class ShoppingCartItemView(APIView):
    """
    A single line of the authenticated user's cart, addressed by product id.

    PUT     sets the absolute quantity {quantity}, creating the line if needed.
            Quantities above the available stock are clamped.
    DELETE  removes the line.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ShoppingCartSerializer

    @extend_schema(request=CartItemInputSerializer)
    def put(self, request: Request, product: int, *args, **kwargs) -> Response:
        serializer = CartItemInputSerializer(
            data={"product": product, "quantity": request.data.get("quantity")}
        )
        serializer.is_valid(raise_exception=True)

        cart, _ = ShoppingCart.objects.get_or_create(user=request.user)
        set_item_quantity(
            cart,
            serializer.validated_data["product"],
            serializer.validated_data["quantity"],
        )

        return serialize_cart(request, cart)

    def delete(self, request: Request, product: int, *args, **kwargs) -> Response:
        cart, _ = ShoppingCart.objects.get_or_create(user=request.user)
        get_object_or_404(Product, pk=product)
        cart.items.filter(product_id=product).delete()
        return serialize_cart(request, cart)


@extend_schema(tags=["Checkout"])
class UserOrderView(ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Order.objects.filter(user=user)
        return queryset
