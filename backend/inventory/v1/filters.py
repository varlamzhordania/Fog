import django_filters

from django.db.models import F, Q

from inventory.models import Product


class CharInFilter(django_filters.BaseInFilter, django_filters.CharFilter):
    """Accepts comma separated values, e.g. ?category=spores,kits"""


class NumberInFilter(django_filters.BaseInFilter, django_filters.NumberFilter):
    """Accepts comma separated numbers, e.g. ?ids=1,2,3"""


class ProductFilter(django_filters.FilterSet):
    ids = NumberInFilter(
        field_name="id",
        lookup_expr="in"
    )
    category = CharInFilter(
        field_name="category__slug",
        lookup_expr="in"
    )
    tags = CharInFilter(
        field_name="tags__slug",
        lookup_expr="in"
    )
    min_price = django_filters.NumberFilter(
        field_name="store_price",
        lookup_expr="gte"
    )
    max_price = django_filters.NumberFilter(
        field_name="store_price",
        lookup_expr="lte"
    )
    STOCK_CHOICES = (
        ("in_stock", "In Stock"),
        ("out_of_stock", "Out of Stock"),
    )
    stock = django_filters.ChoiceFilter(
        choices=STOCK_CHOICES,
        method="filter_stock"
    )

    class Meta:
        model = Product
        fields = ["is_featured", "product_type"]

    def filter_stock(self, queryset, name, value):
        if value == "in_stock":
            # Must be marked available AND physical quantity must exceed reserved holds
            return queryset.filter(
                product_stock__is_available=True,
                product_stock__quantity__gt=F(
                    "product_stock__reserved_quantity"
                )
            )
        elif value == "out_of_stock":
            # Marked unavailable OR physical quantity is entirely reserved/depleted
            return queryset.filter(
                Q(product_stock__is_available=False) |
                Q(
                    product_stock__quantity__lte=F(
                        "product_stock__reserved_quantity"
                    )
                )
            )
        return queryset
