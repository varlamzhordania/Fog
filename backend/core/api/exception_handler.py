from django.conf import settings
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

from core.logging import get_logger
from core.logging.context import current

log = get_logger("api")


def exception_handler(exc, context):
    response = drf_exception_handler(exc, context)
    view = type(context["view"]).__name__

    if response is None:  # not an APIException: a genuine bug
        log.error("api.unhandled", exc_info=exc, extra={"view": view})
        if settings.DEBUG:
            return None  # let Django show the debug page
        return Response(
            {"detail": "Something went wrong. Please try again.",
             "request_id": current().get("request_id")},
            status=500,
        )

    if response.status_code >= 500:
        log.error("api.server_error", exc_info=exc, extra={"view": view})
    return response