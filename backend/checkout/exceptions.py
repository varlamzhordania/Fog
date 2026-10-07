from rest_framework.exceptions import APIException


class CheckoutError(APIException):
    status_code = 400
    default_code = "checkout_error"
    default_detail = "Checkout failed."

class GatewayError(CheckoutError):
    """The payment gateway refused or was unreachable."""

class Conflict(CheckoutError):
    """State changed while we were talking to the gateway."""
    status_code = 409
    default_code = "conflict"
    default_detail = "The request conflicts with the current state of the order."