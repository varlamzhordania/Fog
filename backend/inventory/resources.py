from import_export import fields, resources
from import_export.widgets import ForeignKeyWidget
from .models import Category, Product


class ProductResource(resources.ModelResource):
    category = fields.Field(
        column_name="category",
        attribute="category",
        widget=ForeignKeyWidget(Category, "name"),
    )

    class Meta:
        model = Product
        skip_unchanged = True
        report_skipped = True
        import_id_fields = ["sku"]
        fields = [
            "sku",
            "name",
            "category",
            "product_type",
            "base_price",
            "is_active",
            "is_featured",
        ]
        export_order = fields



