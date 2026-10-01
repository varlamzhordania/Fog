from import_export import fields, resources
from import_export.widgets import ForeignKeyWidget, ManyToManyWidget

from .models import (
    Category, Tag, Product, ProductStock
)


class CategoryResource(resources.ModelResource):
    class Meta:
        model = Category
        skip_unchanged = True
        report_skipped = True
        import_id_fields = ["slug"]
        fields = [
            "id", "name", "slug", "description",
            "is_featured", "is_filterable", "is_active"
        ]
        export_order = fields


class TagResource(resources.ModelResource):
    class Meta:
        model = Tag
        skip_unchanged = True
        report_skipped = True
        import_id_fields = ["name"]
        fields = ["id", "name", "slug", "is_filterable"]
        export_order = fields


class ProductResource(resources.ModelResource):
    category = fields.Field(
        column_name="category",
        attribute="category",
        widget=ForeignKeyWidget(Category, "name"),
    )
    tags = fields.Field(
        column_name="tags",
        attribute="tags",
        widget=ManyToManyWidget(Tag, field="name", separator="|")
    )

    class Meta:
        model = Product
        skip_unchanged = True
        report_skipped = True
        import_id_fields = ["sku"]
        fields = [
            "id",
            "sku",
            "name",
            "slug",
            "category",
            "product_type",
            "base_price",
            "store_price",
            "tags",
            "short_description",
            "is_active",
            "is_featured",
        ]
        export_order = fields


class ProductStockResource(resources.ModelResource):
    product = fields.Field(
        column_name="product_sku",
        attribute="product",
        widget=ForeignKeyWidget(Product, "sku"),
    )

    class Meta:
        model = ProductStock
        skip_unchanged = True
        report_skipped = True
        import_id_fields = ["product"]
        fields = [
            "product",
            "quantity",
            "reserved_quantity",
            "is_available",
            "low_stock_threshold",
        ]
        export_order = fields