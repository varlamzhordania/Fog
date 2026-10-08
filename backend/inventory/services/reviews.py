from constance import config
from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import PermissionDenied, ValidationError

from core.logging.audit import audit
from inventory.models import ProductReview


class ReviewService:
    @staticmethod
    def enabled() -> bool:
        return bool(getattr(config, "PRODUCT_REVIEWS_ENABLED", True))

    @classmethod
    def require_enabled(cls):
        if not cls.enabled():
            raise PermissionDenied("Reviews are currently disabled.")

    @staticmethod
    def has_purchased(user, product) -> bool:
        from checkout.models import Order, OrderItem, OrderPayment

        return OrderItem.objects.filter(
            order__user=user,
            product=product,
            order__status=Order.StatusChoices.DELIVERED,
            order__payment__status=OrderPayment.StatusChoices.COMPLETED,
        ).exists()

    @classmethod
    def create(cls, user, product, rating, comment=""):
        cls.require_enabled()
        if not cls.has_purchased(user, product):
            raise PermissionDenied("Only customers with a delivered order of this product can review it.")
        try:
            with transaction.atomic():
                review = ProductReview.objects.create(
                    product=product, user=user, rating=rating, comment=comment.strip()
                )
        except IntegrityError:  # unique (product, user), also covers double submits
            raise ValidationError({"detail": "You have already reviewed this product."})
        audit("review.created", product_id=product.pk, user_id=user.pk, rating=rating)
        return review

    @classmethod
    def update(cls, user, product, rating, comment=""):
        cls.require_enabled()
        review = get_object_or_404(ProductReview, product=product, user=user)
        review.rating, review.comment = rating, comment.strip()
        review.save(update_fields=["rating", "comment", "updated_at"])
        audit("review.updated", product_id=product.pk, user_id=user.pk, rating=rating)
        return review

    @staticmethod
    def delete(user, product):
        review = get_object_or_404(ProductReview, product=product, user=user)
        review.delete()
        audit("review.deleted", product_id=product.pk, user_id=user.pk)