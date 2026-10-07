import logging
import re

from .context import current

_KEYS = (
    r"password|passwd|token|secret|authorization|api[_-]?key|private[_-]?key"
    r"|seed(?:_phrase)?|xprv|hmac"
)
_BEARER = re.compile(r"(Bearer\s+)[A-Za-z0-9\-._~+/]+=*", re.I)  # runs first, see below
_PAIR = re.compile(
    r"([\"']?\w*(?:" + _KEYS + r")\w*[\"']?\s*[:=]\s*)[\"']?[^\"',\s}&]+[\"']?", re.I
)
_SENSITIVE_KEY = re.compile(_KEYS, re.I)
_STD_ATTRS = set(logging.makeLogRecord({}).__dict__) | {"message", "asctime"}


def scrub(text: str) -> str:
    # Bearer first, otherwise "authorization: Bearer abc" would leave "abc" behind.
    return _PAIR.sub(r'\1"***"', _BEARER.sub(r"\1***", text))


class ContextFilter(logging.Filter):
    """Copy request_id / user_id / task_id / order_id from the context onto every record."""

    def filter(self, record):
        for key, value in current().items():
            if not hasattr(record, key):
                setattr(record, key, value)
        if not hasattr(record, "request_id"):
            record.request_id = "-"
        return True


class SensitiveDataFilter(logging.Filter):
    """Redact secrets in the message, in `extra` fields and in tracebacks."""

    def filter(self, record):
        record.msg, record.args = scrub(record.getMessage()), None
        for key, value in list(record.__dict__.items()):
            if key in _STD_ATTRS:
                continue
            if _SENSITIVE_KEY.search(key):
                record.__dict__[key] = "***"
            elif isinstance(value, str):
                record.__dict__[key] = scrub(value)
        if record.exc_info:
            text = logging.Formatter().formatException(record.exc_info)
            record.exc_text, record.exc_info = scrub(text), None
        return True