import math

from django.db.models import Max, Min
from rest_framework.generics import ListAPIView
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema

from inventory.models import Category, Tag, Product
from core.mixins import OptionalPaginationMixin

from .serializers import (
    CategorySerializer, TagSerializer,
    ProductSerializer,
)
from .filters import ProductFilter



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
            min_price=Min("base_price"),
            max_price=Max("base_price"),
        )
        min_price = prices["min_price"]
        max_price = prices["max_price"]

        return Response({
            "min_price": math.floor(min_price) if min_price is not None else 0,
            "max_price": math.ceil(max_price) if max_price is not None else 0,
        })
