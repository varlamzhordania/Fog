import logging

from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework import status
from drf_spectacular.utils import extend_schema
from django.http import Http404


from checkout.models import (
    PaymentMethod,
    Order,
)

from checkout.services import CartService

from .serializers import (
    ShoppingCartSerializer,
    PaymentMethodSerializer,
    OrderSerializer, ShoppingCartInputSerializer,
)

logger = logging.getLogger("fog")


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
        user = self.request.user
        queryset = Order.objects.filter(user=user)
        return queryset


@extend_schema(tags=["Checkout"])
class ShoppingCartAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        try:
            cart = CartService.get_or_create_cart(request.user)
            serializer = ShoppingCartSerializer(cart)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def delete(self, request: Request) -> Response:
        try:
            CartService.clear_cart(request.user)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


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
                quantity=serializer.validated_data["quantity"]
            )
            return Response(
                ShoppingCartSerializer(cart).data,
                status=status.HTTP_201_CREATED
            )
        except Http404:
            return Response(
                {"detail": "Product not found or inactive."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def patch(self, request: Request, pk: int) -> Response:
        try:
            quantity = int(request.data.get('quantity', 0))

            cart = CartService.update_item_quantity(
                request.user,
                pk,
                quantity
            )
            return Response(
                ShoppingCartSerializer(cart).data,
                status=status.HTTP_200_OK
            )
        except Http404:
            return Response(
                {"detail": "Cart item not found in your cart."},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValueError:
            return Response(
                {"detail": "Invalid quantity format."},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def delete(self, request: Request, pk: int) -> Response:
        try:
            cart = CartService.remove_item(request.user, pk)
            return Response(
                ShoppingCartSerializer(cart).data,
                status=status.HTTP_200_OK
            )
        except Http404:
            return Response(
                {"detail": "Cart item not found in your cart."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
