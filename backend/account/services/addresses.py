from django.db import transaction

from account.models import Address, User
from core.logging.audit import audit


def _lock_user(user_id):
    """Serialise address changes per user, even when they have no addresses yet."""
    User.objects.select_for_update().get(pk=user_id)


def _normalise_defaults(address):
    mine = Address.objects.filter(user_id=address.user_id, is_active=True)
    if address.is_default:
        mine.exclude(pk=address.pk).filter(is_default=True).update(is_default=False)
    elif not mine.filter(is_default=True).exists():  # a user always has a default
        Address.objects.filter(pk=address.pk).update(is_default=True)
        address.is_default = True


class AddressService:
    @staticmethod
    @transaction.atomic
    def create(user, serializer):
        _lock_user(user.pk)
        address = serializer.save(user=user)
        _normalise_defaults(address)
        return address

    @staticmethod
    @transaction.atomic
    def update(serializer):
        _lock_user(serializer.instance.user_id)
        address = serializer.save()
        _normalise_defaults(address)
        return address

    @staticmethod
    @transaction.atomic
    def remove(address):
        """Delete, or deactivate when an order still points at it (FK is PROTECT)."""
        _lock_user(address.user_id)
        was_default = address.is_default
        if address.orders.exists():
            address.is_active = address.is_default = False
            address.save(update_fields=["is_active", "is_default", "updated_at"])
            outcome = "deactivated"
        else:
            address.delete()
            outcome = "deleted"

        if was_default:  # promote the most recently used remaining address
            nxt = (Address.objects.filter(user_id=address.user_id, is_active=True)
                   .order_by("-updated_at").first())
            if nxt:
                Address.objects.filter(pk=nxt.pk).update(is_default=True)
        audit("address.removed", user_id=address.user_id, outcome=outcome)