from django.http import Http404
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet

from core.logging import get_logger
from checkout.models import PaymentMethod
from checkout.selectors.orders import order_detail, orders_for_user
from checkout.services.cart import CartService
from checkout.services.checkout import CheckoutService
from checkout.services.orders import OrderService
from checkout.services.payments import PaymentService

from .serializers import (
    OrderSerializer,
    PaymentMethodSerializer,
    ShoppingCartInputSerializer,
    ShoppingCartSerializer, ShoppingCartItemUpdateSerializer,
    OrderCreateSerializer, OrderPaySerializer,
)

log = get_logger(__name__)


@extend_schema(tags=["Checkout"])
class PaymentMethodListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = PaymentMethod.objects.filter(is_active=True)
    serializer_class = PaymentMethodSerializer
    pagination_class = None


@extend_schema(tags=["Checkout"])
class UserOrderView(ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer

    def get_queryset(self):
        return orders_for_user(self.request.user)

    def retrieve(self, request, *args, **kwargs):
        pk = str(kwargs.get("pk", ""))
        if pk.isdigit():
            OrderService.expire_if_needed(int(pk))
        return super().retrieve(request, *args, **kwargs)


def _order_payload(order_id, request, instructions=None):
    return {
        "order": OrderSerializer(
            order_detail(order_id),
            context={"request": request}
            ).data,
        "payment_instructions": instructions,
    }


@extend_schema(tags=["Checkout"], request=OrderCreateSerializer)
class OrderCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        order, instructions = CheckoutService.create_order(
            user=request.user,
            payment_method_code=data["payment_method"],
            address_id=data.get("address_id"),
            address_data=dict(data["address"]) if data.get(
                "address"
                ) else None,
            save_address=data["save_address"],
            notes=data.get("notes", ""),
        )
        return Response(
            _order_payload(order.pk, request, instructions),
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=["Checkout"], request=OrderPaySerializer)
class OrderPayView(APIView):
    """Start/retry/switch the payment provider while the order is still open."""
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, pk: int) -> Response:
        serializer = OrderPaySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order, instructions = PaymentService.start_payment(
            pk, request.user, serializer.validated_data["payment_method"]
        )
        return Response(_order_payload(order.pk, request, instructions))


@extend_schema(tags=["Checkout"])
class OrderCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, pk: int) -> Response:
        order = OrderService.customer_cancel(pk, request.user)
        return Response(_order_payload(order.pk, request))

@extend_schema(tags=["Checkout"])
class ShoppingCartAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart = CartService.get_or_create_cart(request.user)
        return Response(
            ShoppingCartSerializer(cart, context={"request": request}).data
            )

    def delete(self, request):
        CartService.clear_cart(request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=["Checkout"])
class ShoppingCartItemAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        serializer = ShoppingCartInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            cart = CartService.add_to_cart(
                user=request.user,
                product_id=serializer.validated_data["product_id"],
                quantity=serializer.validated_data["quantity"],
            )
            return Response(
                ShoppingCartSerializer(
                    cart,
                    context={"request": request}
                ).data,
                status=status.HTTP_201_CREATED,
            )
        except Http404:
            return Response(
                {"detail": "Product not found or inactive."},
                status=status.HTTP_404_NOT_FOUND,
            )

    def patch(self, request: Request, product_id: int) -> Response:
        serializer = ShoppingCartItemUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            cart = CartService.update_item_quantity(
                user=request.user,
                product_id=product_id,
                quantity=serializer.validated_data["quantity"],
                action=serializer.validated_data["action"],
            )
            return Response(
                ShoppingCartSerializer(
                    cart,
                    context={"request": request}
                ).data,
                status=status.HTTP_200_OK,
            )
        except Http404:
            return Response(
                {"detail": "Cart item not found."},
                status=status.HTTP_404_NOT_FOUND
            )

    def delete(self, request: Request, product_id: int) -> Response:
        try:
            cart = CartService.remove_item(
                user=request.user,
                product_id=product_id
            )
            return Response(
                ShoppingCartSerializer(
                    cart,
                    context={"request": request}
                ).data,
                status=status.HTTP_200_OK,
            )
        except Http404:
            return Response(
                {"detail": "Cart item not found."},
                status=status.HTTP_404_NOT_FOUND
            )
