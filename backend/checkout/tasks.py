from celery import shared_task

from checkout.services.order import OrderService


@shared_task
def expire_unpaid_orders():
    """Cancel unpaid orders whose payment window ended and release their stock."""
    return OrderService.expire_due_orders()
