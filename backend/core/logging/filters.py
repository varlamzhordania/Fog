import logging
from .context import current

class ContextFilter(logging.Filter):
    def filter(self, record):
        record.request_id = "-"
        for k, v in current().items():
            setattr(record, k, v)
        return True