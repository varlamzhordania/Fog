from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP

from constance import config

CENT = Decimal("0.01")


@dataclass(frozen=True)
class Totals:
    subtotal: Decimal  
    shipping: Decimal
    tax_amount: Decimal
    total: Decimal
    tax_rate: Decimal
    tax_name: str
    tax_included: bool


def _q(value):
    return Decimal(value).quantize(CENT, rounding=ROUND_HALF_UP)


def compute_totals(subtotal, shipping=0) -> Totals:
    subtotal, shipping = _q(subtotal), _q(shipping)
    gross = subtotal + shipping
    rate = Decimal(str(getattr(config, "TAX_RATE", 0) or 0))
    if not getattr(config, "TAX_ENABLED", False) or rate <= 0:
        return Totals(subtotal, shipping, Decimal("0.00"), gross, Decimal("0.00"), "", False)

    included = bool(getattr(config, "PRICES_INCLUDE_TAX", False))
    base = subtotal + (shipping if getattr(config, "TAX_ON_SHIPPING", True) else Decimal("0.00"))
    if included:
        tax, total = _q(base * rate / (100 + rate)), gross
    else:
        tax = _q(base * rate / 100)
        total = gross + tax
    return Totals(subtotal, shipping, tax, total, _q(rate),
                  str(getattr(config, "TAX_NAME", "") or "Tax")[:30], included)