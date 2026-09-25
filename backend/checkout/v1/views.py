import logging

from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.request import Request
from rest_framework import status
from drf_spectacular.utils import extend_schema

from checkout.models import (
    PaymentMethod,
    ShoppingCart,
    ShoppingCartItem,
    Order,
)

from inventory.models import Product

from .serializers import (
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


@extend_schema(tags=["Checkout"])
class ShoppingCartView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ShoppingCartSerializer

    def get(self, request: Request, *args, **kwargs) -> Response:
        user = request.user

        shopping_cart, _ = ShoppingCart.objects.get_or_create(user=user)

        serializer = self.serializer_class(
            shopping_cart,
            context={"request": request}
        )

        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request: Request, *args, **kwargs) -> Response:
        user = request.user
        items: list = request.data

        if not items:
            return Response(
                {"detail": "No items provided."},
                status=status.HTTP_400_BAD_REQUEST
            )

        shopping_cart, _ = ShoppingCart.objects.get_or_create(user=user)

        for item in items:
            try:
                quantity = int(item["quantity"])
                product = Product.objects.get(id=item["product"])

                if quantity <= 0:
                    return Response(
                        {"detail": "Quantity must be positive."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                ShoppingCartItem.objects.update_or_create(
                    cart=shopping_cart,
                    product=product,
                    defaults={"quantity": quantity}
                )
            except ValueError:
                return Response(
                    {"detail": "Quantity must be positive integer."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            except Product.DoseNotExist:
                return Response(
                    {"detail": "Product does not exist."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            except KeyError:
                return Response(
                    {"detail": "Invalid item format."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response(
            {
                "message": "Your shopping cart has been updated successfully."},
            status=status.HTTP_200_OK
        )

    def delete(self, request: Request, *args, **kwargs) -> Response:
        user = request.user
        data = request.data

        if not data:
            return Response(
                {"detail": "No data provided for deletion."},
                status=status.HTTP_400_BAD_REQUEST
            )

        shopping_cart, _ = ShoppingCart.objects.get_or_create(user=user)
        product = Product.objects.get(id=data.get("product"))

        try:
            deleted, _ = ShoppingCartItem.objects.filter(
                cart=shopping_cart,
                product=product,
            ).delete()

            return Response(
                {
                    "message": f"Deleted item from your shopping cart."},
                status=status.HTTP_200_OK
            )

        except Product.DoseNotExist:
            return Response(
                {"detail": "Product does not exist."},
            )

        except Exception as e:
            return Response(
                {
                    "detail": f"Error processing item: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )


@extend_schema(tags=["Checkout"])
class UserOrderView(ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Order.objects.filter(user=user)
        return queryset
