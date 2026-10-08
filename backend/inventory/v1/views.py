import math

from django.core.cache import cache
from django.db.models import Max, Min
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import filters, permissions
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet

from core.api.mixins import OptionalPaginationMixin
from inventory.models import Product, Tag
from inventory.selectors import catalog, home

from .filters import ProductFilter
from .serializers import CategorySerializer, ProductSerializer, TagSerializer


class CatalogContextMixin:

    def get_serializer_context(self):
        return {**super().get_serializer_context(), **catalog.serializer_context()}


@extend_schema(tags=["Inventory"])
class HomeView(APIView):
    permission_classes = (permissions.AllowAny,)
    CACHE_KEY, CACHE_SECONDS = "home:v1", 120

    def get(self, request):
        data = cache.get(self.CACHE_KEY)
        if data is None:
            data = self._build(request)
            cache.set(self.CACHE_KEY, data, self.CACHE_SECONDS)
        return Response(data)

    @staticmethod
    def _build(request):
        context = {"request": request, **catalog.serializer_context()}

        def ser(qs):
            return ProductSerializer(qs, many=True, context=context).data

        sections = home.home_sections()
        return {
            "new_arrivals": ser(sections["new_arrivals"]),
            "best_sellers": ser(sections["best_sellers"]),
            "deals": ser(sections["deals"]),
            "last_few": ser(sections["last_few"]),
            "stats": sections["stats"],
        }


@extend_schema(tags=["Inventory"])
class CategoryViewSet(OptionalPaginationMixin, CatalogContextMixin, ListAPIView):
    serializer_class = CategorySerializer
    permission_classes = (permissions.AllowAny,)
    filter_backends = (DjangoFilterBackend, filters.SearchFilter)
    filterset_fields = ("is_featured", "depth", "is_filterable")
    search_fields = ("name", "slug")

    def get_queryset(self):
        return catalog.visible_categories().select_related("img")


@extend_schema(tags=["Inventory"])
class TagViewSet(OptionalPaginationMixin, ListAPIView):
    queryset = Tag.objects.filter(is_active=True)
    serializer_class = TagSerializer
    permission_classes = (permissions.AllowAny,)
    filter_backends = (DjangoFilterBackend, filters.SearchFilter)
    filterset_fields = ("is_filterable",)
    search_fields = ("name", "slug")


@extend_schema(tags=["Inventory"])
class ProductViewSet(OptionalPaginationMixin, CatalogContextMixin, ReadOnlyModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = (permissions.AllowAny,)
    lookup_field = "slug"
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ["name", "sku", "short_description"]
    ordering_fields = ["store_price", "created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return catalog.catalog_products().distinct()


@extend_schema(tags=["Inventory"])
class ProductPriceRangeView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        prices = Product.objects.filter(is_active=True).aggregate(
            min_price=Min("store_price"), max_price=Max("store_price"),
        )
        low, high = prices["min_price"], prices["max_price"]
        return Response({
            "min_price": math.floor(low) if low is not None else 0,
            "max_price": math.ceil(high) if high is not None else 0,
        })