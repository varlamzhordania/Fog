from constance import config

from checkout import events
from checkout.exceptions import CheckoutError
from checkout.services._common import get_method
from checkout.services.cart import CartService
from checkout.services.orders import OrderService
from checkout.services.payments import PaymentService
from core.logging.audit import audit


class CheckoutService:
    @classmethod
    def create_order(cls, user, payment_method_code, address_id=None,
                     address_data=None, save_address=True, notes=""):
        if getattr(config, "STORE_MAINTENANCE_MODE", False):
            raise CheckoutError("Checkout is temporarily disabled for maintenance.")
        method = get_method(payment_method_code)

        # 1. Short transaction: validate, reserve stock, create order.
        order, _ = OrderService.place(
            user, method, address_id=address_id, address_data=address_data,
            save_address=save_address, notes=notes,
        )

        # 2. Gateway call, no locks held. On failure the stock goes back, silently.
        try:
            order, instructions = PaymentService.start(order.pk, method)
        except Exception:
            OrderService.cancel_order(order.pk, "Payment gateway unavailable.", notify=False)
            raise

        # 3. Only now is the cart emptied, so a failed checkout never loses it.
        CartService.clear_cart(user)
        events.order_event(order.id, "order_created")
        audit("order.created", order_id=order.id, user_id=user.pk,
              total=str(order.total_price), method=method.code)
        return order, instructions