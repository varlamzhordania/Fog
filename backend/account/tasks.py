from celery import shared_task
from account.models import User
from account.v1.helpers import send_password_reset_email
from core.logging import get_logger

log = get_logger(__name__)


@shared_task(
    autoretry_for=(Exception,), dont_autoretry_for=(User.DoesNotExist,),
    retry_backoff=30, retry_backoff_max=900, max_retries=5,
)
def send_password_reset_email_task(user_id: int):
    user = User.objects.get(pk=user_id)
    send_password_reset_email(user)
    log.info("account.password_reset.email_sent", extra={"user_id": user_id})