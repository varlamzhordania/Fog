from import_export import fields, resources

from .models import Order

class OrderResource(resources.ModelResource):
    user_email = fields.Field(column_name="customer_email")

    class Meta:
        model = Order
        import_id_fields = ["id"]
        fields = [
            "id",
            "order_token",
            "user_email",
            "total_amount",
            "status",
            "created_at",
        ]
        export_order = fields

    def dehydrate_user_email(self, order):
        return order.user.email if order.user else "Anonymous"