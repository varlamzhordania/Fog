from django.contrib.auth import get_user_model
from django.contrib.auth.signals import user_logged_in
from django.contrib.auth.models import Group
from django.db.models.signals import post_save
from django.dispatch import receiver

from core.logging import get_logger

log = get_logger(__name__)

User = get_user_model()


@receiver(post_save, sender=User)
def add_default_group(sender, instance, created, **kwargs):
    if created:
        group, _ = Group.objects.get_or_create(name="customer")
        instance.groups.add(group)


@receiver(user_logged_in, sender=User)
def update_last_ip_address(sender, request, user, **kwargs):
    ip_address = request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[
                     0] or request.META.get('REMOTE_ADDR')

    if not ip_address:
        log.warning(
            f"User {user.pk} logged in, but no IP address found in request."
        )
        return

    if user.last_ip != ip_address:
        user.last_ip = ip_address
        user.save(update_fields=['last_ip'])

        log.info(
            f"User {user.pk} IP address updated to {ip_address}."
        )
    else:
        log.info(
            f"User {user.pk} logged in from the same IP address: {ip_address}."
        )
