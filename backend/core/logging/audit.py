from . import get_logger

_log = get_logger("audit")


def audit(event: str, **fields) -> None:
    """Business-significant state change, e.g. audit("order.paid", order_id=7, tx="..")."""
    _log.info(event, extra=fields)