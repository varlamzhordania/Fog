from collections import defaultdict
from django.db.models import Prefetch

from inventory.models import Category, Product, ProductPrice



def visible_categories():
    """Active categories whose ancestors are all active (the model promises this)."""
    rows = list(Category.objects.values_list("pk", "path", "is_active"))
    hidden = [path for _, path, active in rows if not active]
    ids = [
        pk for pk, path, active in rows
        if active and not any(path.startswith(h) for h in hidden)
    ]
    return Category.objects.filter(pk__in=ids)


def category_lookups():
    """
    One query that gives serializers everything they need about the tree:
    children by parent path and the "A > B > C" breadcrumb per category.
    """
    step = Category.steplen
    cats = list(visible_categories().select_related("img").order_by("path"))
    by_path = {c.path: c for c in cats}

    children, breadcrumbs = defaultdict(list), {}
    for cat in cats:
        children[cat.path[:-step]].append(cat)
        breadcrumbs[cat.pk] = " > ".join(
            by_path[cat.path[:i]].name
            for i in range(step, len(cat.path) + 1, step)
            if cat.path[:i] in by_path
        )
    return {"children": dict(children), "breadcrumbs": breadcrumbs}


def serializer_context():
    return {"category_lookups": category_lookups()}


def catalog_products(detail=True):
    qs = (
        Product.objects.filter(is_active=True)
        .select_related("product_stock")
        .prefetch_related("product_media_items__media")
    )
    if detail:
        qs = qs.select_related("category").prefetch_related("tags")
    return qs