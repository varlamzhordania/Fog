from rest_framework.exceptions import APIException


class CheckoutError(APIException):
    status_code = 400
    default_code = "checkout_error"
    default_detail = "Checkout failed."