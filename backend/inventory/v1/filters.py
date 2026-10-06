import django_filters

from django.db.models import (
    Case,
    DecimalField,
    ExpressionWrapper,
    F,
    IntegerField,
    Q,
    Value,
    When,
)
from django.db.models.functions import Cast, Round

from inventory.models import Product


class CharInFilter(django_filters.BaseInFilter, django_filters.CharFilter):
    """Accepts comma separated values, e.g. ?category=spores,kits"""


class NumberInFilter(django_filters.BaseInFilter, django_filters.NumberFilter):
    """Accepts comma separated numbers, e.g. ?ids=1,2,3"""


class ProductFilter(django_filters.FilterSet):
    ids = NumberInFilter(
        field_name="id",
        lookup_expr="in",
    )

    category = CharInFilter(
        field_name="category__slug",
        lookup_expr="in",
    )

    tags = CharInFilter(
        field_name="tags__slug",
        lookup_expr="in",
    )

    min_price = django_filters.NumberFilter(
        field_name="store_price",
        lookup_expr="gte",
    )

    max_price = django_filters.NumberFilter(
        field_name="store_price",
        lookup_expr="lte",
    )

    discounted = django_filters.BooleanFilter(
        method="filter_discounted",
    )

    min_discount = django_filters.NumberFilter(
        method="filter_min_discount",
    )

    max_discount = django_filters.NumberFilter(
        method="filter_max_discount",
    )

    STOCK_CHOICES = (
        ("in_stock", "In Stock"),
        ("out_of_stock", "Out of Stock"),
    )

    stock = django_filters.ChoiceFilter(
        choices=STOCK_CHOICES,
        method="filter_stock",
    )

    class Meta:
        model = Product
        fields = [
            "is_featured",
            "product_type",
        ]

    def filter_discounted(self, queryset, name, value):
        if value is None:
            return queryset

        if value:
            return queryset.filter(
                base_price__gt=F("store_price"),
            )

        return queryset.filter(
            base_price__lte=F("store_price"),
        )

    def filter_min_discount(self, queryset, name, value):
        if value is None:
            return queryset

        return self._with_discount_percentage(queryset).filter(
            discount_percentage__gte=value,
        )

    def filter_max_discount(self, queryset, name, value):
        if value is None:
            return queryset

        return self._with_discount_percentage(queryset).filter(
            discount_percentage__lte=value,
        )

    @staticmethod
    def _with_discount_percentage(queryset):
        raw_discount = ExpressionWrapper(
            (
                (F("base_price") - F("store_price"))
                / F("base_price")
                * Value(100)
            ),
            output_field=DecimalField(
                max_digits=12,
                decimal_places=4,
            ),
        )

        rounded_discount = Case(
            When(
                Q(base_price__lte=0)
                | Q(store_price__gte=F("base_price")),
                then=Value(0),
            ),
            default=Cast(
                Round(raw_discount, precision=0),
                output_field=IntegerField(),
            ),
            output_field=IntegerField(),
        )

        return queryset.annotate(
            discount_percentage=rounded_discount,
        )

    def filter_stock(self, queryset, name, value):
        if value == "in_stock":
            return queryset.filter(
                product_stock__is_available=True,
                product_stock__quantity__gt=F(
                    "product_stock__reserved_quantity"
                ),
            )

        if value == "out_of_stock":
            return queryset.filter(
                Q(product_stock__is_available=False)
                | Q(
                    product_stock__quantity__lte=F(
                        "product_stock__reserved_quantity"
                    )
                )
            )

        return queryset