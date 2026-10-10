from inventory.models import Product


def ensure_default_prices():
    """Give every product without options a single 'Each' option."""
    for product in Product.objects.filter(prices__isnull=True):
        product.get_default_price()