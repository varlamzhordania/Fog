from rest_framework.generics import ListAPIView
from rest_framework import permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema

from inventory.models import Category, Tag
from core.mixins import OptionalPaginationMixin

from .serializers import CategorySerializer, TagSerializer


@extend_schema(tags=["Inventory"])
class CategoryViewSet(OptionalPaginationMixin, ListAPIView):
    queryset = Category.objects.filter(
        is_active=True,
    )
    serializer_class = CategorySerializer
    permission_classes = (permissions.AllowAny,)
    filter_backends = (DjangoFilterBackend, filters.SearchFilter,)
    filterset_fields = ("is_featured", "depth", "is_filterable",)
    search_fields = ("name", "slug",)


@extend_schema(tags=["Inventory"])
class TagViewSet(OptionalPaginationMixin, ListAPIView):
    queryset = Tag.objects.filter(
        is_active=True,
    )
    serializer_class = TagSerializer
    permission_classes = (permissions.AllowAny,)
    filter_backends = (DjangoFilterBackend, filters.SearchFilter,)
    filterset_fields = ("is_filterable",)
    search_fields = ("name", "slug",)