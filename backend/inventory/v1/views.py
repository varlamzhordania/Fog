import math
from django.core.cache import cache
from django.db.models import F, Sum
from django.db.models import Max, Min
from rest_framework.generics import ListAPIView
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema

from checkout.models import Order, OrderPayment
from inventory.models import Category, Tag, Product
from core.api.mixins import OptionalPaginationMixin

from .serializers import (
    CategorySerializer, TagSerializer,
    ProductSerializer,
)
from .filters import ProductFilter




@extend_schema(tags=["Inventory"])
class HomeView(APIView):
    permission_classes = (permissions.AllowAny,)
    CACHE_SECONDS = 120

    def get(self, request):
        data = cache.get("home:v1")
        if data is None:
            data = self._build(request)
            cache.set("home:v1", data, self.CACHE_SECONDS)
        return Response(data)

    def _build(self, request):
        def ser(qs):
            return ProductSerializer(
                qs, many=True, context={"request": request}
            ).data

        paid = OrderPayment.StatusChoices.COMPLETED

        new_arrivals = self._base().order_by("-created_at")[:10]

        best_sellers = (
            self._base()
            .filter(order_items__order__payment__status=paid)
            .annotate(sold=Sum("order_items__quantity"))
            .order_by("-sold")[:10]
        )

        deals = list(
            self._base()
            .filter(store_price__lt=F("base_price"))
            .annotate(saving=F("base_price") - F("store_price"))
            .order_by("-saving")[:8]
        )

        last_few = (
            self._base()
            .filter(product_type="physical")
            .annotate(
                avail=F("product_stock__quantity")
                      - F("product_stock__reserved_quantity")
            )
            .filter(
                avail__gt=0,
                avail__lte=F("product_stock__low_stock_threshold"),
            )
            .order_by("avail")[:10]
        )

        orders = Order.objects.filter(payment__status=paid)
        stats = {
            "products": Product.objects.filter(is_active=True).count(),
            "countries": orders.values("delivery_address__country")
            .distinct().count(),
            "orders_delivered": Order.objects.filter(
                status=Order.StatusChoices.DELIVERED
            ).count(),
            "max_discount": max(
                (p.discount_percentage for p in deals), default=0
            ),
        }

        return {
            "new_arrivals": ser(new_arrivals),
            "best_sellers": ser(best_sellers),
            "deals": ser(deals),
            "last_few": ser(last_few),
            "stats": stats,
        }

    def _base(self):
        return (
            Product.objects.filter(
                is_active=True,
                product_stock__is_available=True
            )
            .select_related("category", "product_stock")
            .prefetch_related("tags", "product_media_items__media")
        )


@extend_schema(tags=["Inventory"])
class CategoryViewSet(OptionalPaginationMixin, ListAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = (permissions.AllowAny,)
    filter_backends = (DjangoFilterBackend, filters.SearchFilter,)
    filterset_fields = ("is_featured", "depth", "is_filterable",)
    search_fields = ("name", "slug",)


@extend_schema(tags=["Inventory"])
class TagViewSet(OptionalPaginationMixin, ListAPIView):
    queryset = Tag.objects.filter(is_active=True)
    serializer_class = TagSerializer
    permission_classes = (permissions.AllowAny,)
    filter_backends = (DjangoFilterBackend, filters.SearchFilter,)
    filterset_fields = ("is_filterable",)
    search_fields = ("name", "slug",)


@extend_schema(tags=["Inventory"])
class ProductViewSet(
    OptionalPaginationMixin,
    ReadOnlyModelViewSet
):
    serializer_class = ProductSerializer
    permission_classes = (permissions.AllowAny,)
    lookup_field = "slug"

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_class = ProductFilter

    search_fields = ["name", "sku", "short_description"]
    ordering_fields = ["store_price", "created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return Product.objects.filter(
            is_active=True
        ).select_related(
            "category",
            "product_stock"
        ).prefetch_related(
            "tags",
            "product_media_items__media"
        ).distinct()


@extend_schema(tags=["Inventory"])
class ProductPriceRangeView(APIView):
    """Lowest and highest price among active products, used by price filters."""
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        prices = Product.objects.filter(is_active=True).aggregate(
            min_price=Min("store_price"),
            max_price=Max("store_price"),
        )
        min_price = prices["min_price"]
        max_price = prices["max_price"]

        return Response(
            {
                "min_price": math.floor(
                    min_price
                ) if min_price is not None else 0,
                "max_price": math.ceil(
                    max_price
                ) if max_price is not None else 0,
            }
        )
