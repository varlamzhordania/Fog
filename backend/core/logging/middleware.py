import time, uuid
from .context import bind, clear
from . import get_logger

log = get_logger("http")

class RequestLogMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        rid = request.headers.get("X-Request-ID") or uuid.uuid4().hex
        clear(); bind(request_id=rid)
        start = time.perf_counter()
        try:
            response = self.get_response(request)
        except Exception:
            log.exception("http.unhandled", extra={"path": request.path})
            raise
        log.info("http.request", extra={
            "method": request.method, "path": request.path,
            "status": response.status_code,
            "ms": round((time.perf_counter() - start) * 1000),
        })
        response["X-Request-ID"] = rid
        return response