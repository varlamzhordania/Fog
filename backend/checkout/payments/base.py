class PaymentProvider:
    """
    One class per payment gateway. `codes` are the PaymentMethod.code values it serves.
    - instructions(): pure, no side effects. Safe to call on every order fetch.
    - initiate(): may create an invoice/address at the gateway. Called once per
      (re)start of a payment.
    """
    codes: tuple = ()

    def instructions(self, order, payment, method) -> dict:
        raise NotImplementedError

    def initiate(self, order, payment, method) -> dict:
        return self.instructions(order, payment, method)