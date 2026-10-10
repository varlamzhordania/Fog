import math

from django.core.cache import cache
from django.db.models import Max, Min
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema
from rest_framework import filters, permissions
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet
from rest_framework import status

from core.api.mixins import OptionalPaginationMixin
from inventory.models import Product, Tag
from inventory.selectors import catalog, home
from inventory.services.reviews import ReviewService

from .filters import ProductFilter
from .serializers import (
    CategorySerializer, ProductSerializer, ProductListSerializer,
    TagSerializer, ProductReviewSerializer, ProductReviewWriteSerializer,
)


class CatalogContextMixin:

    def get_serializer_context(self):
        return {**super().get_serializer_context(),
                **catalog.serializer_context()}


@extend_schema(tags=["Inventory"])
class HomeView(APIView):
    permission_classes = (permissions.AllowAny,)
    CACHE_KEY, CACHE_SECONDS = "home:v1", 120

    def get(self, request):
        data = cache.get(self.CACHE_KEY)
        if data is None:
            data = self._build()
            cache.set(self.CACHE_KEY, data, self.CACHE_SECONDS)
        return Response(data)


    def _build(request):
        def ser(qs):
            return ProductListSerializer(qs, many=True).data

        sections = home.home_sections()
        return {
            "new_arrivals": ser(sections["new_arrivals"]),
            "best_sellers": ser(sections["best_sellers"]),
            "deals": ser(sections["deals"]),
            "last_few": ser(sections["last_few"]),
            "stats": sections["stats"],
        }


@extend_schema(tags=["Inventory"])
class CategoryViewSet(
    OptionalPaginationMixin,
    CatalogContextMixin,
    ListAPIView
):
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
class ProductViewSet(
    OptionalPaginationMixin,
    ReadOnlyModelViewSet
):
    serializer_class = ProductSerializer
    permission_classes = (permissions.AllowAny,)
    lookup_field = "slug"
    filter_backends = [DjangoFilterBackend, filters.SearchFilter,
                       filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ["name", "sku", "short_description"]
    ordering_fields = ["store_price", "created_at", "rating_average"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        return ProductListSerializer if self.action == "list" else ProductSerializer

    def get_queryset(self):
        return catalog.catalog_products(
            detail=self.action != "list"
        ).distinct()


class ReviewProductMixin:
    def get_product(self):
        if not hasattr(self, "_product"):
            self._product = get_object_or_404(
                Product, slug=self.kwargs["slug"], is_active=True
            )
        return self._product


@extend_schema(tags=["Inventory"])
class ProductReviewListCreateView(ReviewProductMixin, ListAPIView):
    serializer_class = ProductReviewSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        return self.get_product().reviews.filter(
            is_active=True
            ).select_related("user")

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        product = self.get_product()
        if isinstance(response.data, dict):
            response.data["summary"] = {
                "average": float(product.rating_average),
                "count": product.rating_count,
            }
        return response

    @extend_schema(
        request=ProductReviewWriteSerializer,
        responses=ProductReviewSerializer
        )
    def post(self, request, slug):
        data = ProductReviewWriteSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        review = ReviewService.create(
            request.user,
            self.get_product(),
            **data.validated_data
            )
        return Response(
            ProductReviewSerializer(
                review,
                context={"request": request}
                ).data,
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=["Inventory"])
class MyProductReviewView(ReviewProductMixin, APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, slug):
        product = self.get_product()
        review = product.reviews.filter(user=request.user).first()
        return Response(
            {
                "enabled": ReviewService.enabled(),
                "has_purchased": ReviewService.has_purchased(
                    request.user,
                    product
                    ),
                "review": ProductReviewSerializer(
                    review,
                    context={"request": request}
                    ).data
                if review else None,
            }
        )

    @extend_schema(
        request=ProductReviewWriteSerializer,
        responses=ProductReviewSerializer
        )
    def patch(self, request, slug):
        data = ProductReviewWriteSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        review = ReviewService.update(
            request.user,
            self.get_product(),
            **data.validated_data
            )
        return Response(
            ProductReviewSerializer(
                review,
                context={"request": request}
                ).data
            )

    def delete(self, request, slug):
        ReviewService.delete(request.user, self.get_product())
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=["Inventory"])
class ProductPriceRangeView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        prices = Product.objects.filter(is_active=True).aggregate(
            min_price=Min("store_price"), max_price=Max("store_price"),
        )
        low, high = prices["min_price"], prices["max_price"]
        return Response(
            {
                "min_price": math.floor(low) if low is not None else 0,
                "max_price": math.ceil(high) if high is not None else 0,
            }
        )
