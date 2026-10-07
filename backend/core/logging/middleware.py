import logging
import re
import time
import uuid

from . import get_logger
from .context import bind, clear

log = get_logger("http")
_VALID_ID = re.compile(r"^[A-Za-z0-9_-]{8,64}$")
_QUIET_PREFIXES = ("/static/", "/media/")


class RequestLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        incoming = request.headers.get("X-Request-ID", "")
        rid = incoming if _VALID_ID.match(incoming) else uuid.uuid4().hex
        clear()
        bind(request_id=rid)
        request.request_id = rid
        start = time.perf_counter()

        try:
            response = self.get_response(request)
        except Exception:
            log.exception("http.unhandled", extra={"method": request.method, "path": request.path})
            raise

        status = response.status_code
        if status >= 500:
            level = logging.ERROR
        elif status >= 400:
            level = logging.WARNING
        elif request.path.startswith(_QUIET_PREFIXES):
            level = logging.DEBUG
        else:
            level = logging.INFO

        log.log(level, "http.request", extra={
            "method": request.method,
            "path": request.path,
            "status": status,
            "ms": round((time.perf_counter() - start) * 1000),
        })
        response["X-Request-ID"] = rid
        return response