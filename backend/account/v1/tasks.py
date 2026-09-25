from celery import shared_task
from account.models import User
from .helpers import send_password_reset_email

import logging

logger = logging.getLogger("celery")


@shared_task
def send_password_reset_email_task(user_id: int):
    try:
        user = User.objects.get(pk=user_id)
        send_password_reset_email(user)
    except User.DoesNotExist:
        logger.error(f"[CELERY][PASSWORD RESET EMAIL]: User with id {user_id} does not exist.")

    except Exception as error:
        logger.error(f"[CELERY][PASSWORD RESET EMAIL]: Something went wrong, {error}")
        pass