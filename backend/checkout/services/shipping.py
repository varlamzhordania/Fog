from checkout.exceptions import CheckoutError
from checkout.models import ShippingMethod

PHYSICAL_TYPES = {"physical", "other"}


class ShippingService:
    @staticmethod
    def requires_shipping(products) -> bool:
        return any(p.product_type in PHYSICAL_TYPES for p in products)

    @staticmethod
    def available(country=None):
        methods = ShippingMethod.objects.filter(is_active=True)
        if country is None:
            return list(methods)
        return [m for m in methods if m.serves(country)]

    @classmethod
    def resolve(cls, code, country, subtotal):
        if not code:
            raise CheckoutError("Choose a shipping method.")
        method = next((m for m in cls.available(country) if m.code == code), None)
        if not method:
            raise CheckoutError("This shipping method is not available for your address.")
        return method, method.cost_for(subtotal)