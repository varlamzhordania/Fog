from django.db import transaction
from . import get_logger

_log = get_logger("audit")


def audit(event: str, **fields) -> None:
    """Business-significant state change, e.g. audit("order.paid", order_id=7)."""
    _log.info(event, extra=fields)


def audit_on_commit(event: str, **fields) -> None:
    """Same, but only if the surrounding transaction commits (runs now outside one)."""
    transaction.on_commit(lambda: audit(event, **fields))