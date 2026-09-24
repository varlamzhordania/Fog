import logging
import re
from typing import Any

# Sensitive fields to scrub from logs
SENSITIVE_PATTERNS = [
    re.compile(r"('?(?:private_key|seed|seed_phrase|xprv|password|token|secret|authorization)'?\s*[:=]\s*)('?[^',\s]+'?)", re.IGNORECASE),
    re.compile(r"(Bearer\s+)([A-Za-z0-9\-\._~\+\/]+=*)", re.IGNORECASE),
]

MASK = r"\1'***REDACTED***'"


class SensitiveDataFilter(logging.Filter):
    """
    Scans log messages and dict arguments to mask sensitive credentials,
    crypto secrets, private keys, and authorization headers.
    """

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = self.mask_string(record.msg)

        if record.args:
            if isinstance(record.args, dict):
                record.args = {k: self.mask_value(k, v) for k, v in record.args.items()}
            elif isinstance(record.args, tuple):
                record.args = tuple(self.mask_string(str(arg)) if isinstance(arg, str) else arg for arg in record.args)

        return True

    @staticmethod
    def mask_string(text: str) -> str:
        for pattern in SENSITIVE_PATTERNS:
            text = pattern.sub(MASK, text)
        return text

    @classmethod
    def mask_value(cls, key: str, value: Any) -> Any:
        sensitive_keys = {"password", "token", "secret", "private_key", "seed", "seed_phrase", "xprv", "authorization"}
        if any(s in str(key).lower() for s in sensitive_keys):
            return "***REDACTED***"
        if isinstance(value, str):
            return cls.mask_string(value)
        return value