import math
from datetime import datetime, time, timedelta
from decimal import Decimal

from django.db.models import (
    CharField,
    Count,
    ExpressionWrapper,
    F,
    IntegerField,
    Q,
    Sum,
    Value,
)
from django.db.models.functions import Coalesce, TruncDate
from django.contrib import admin
from django.urls import reverse
from django.utils import timezone
from django.utils.cache import patch_vary_headers
from django.utils.translation import gettext_lazy as _
from django.utils.translation import ngettext
from django.views.generic import TemplateView
from unfold.admin import ModelAdmin
from unfold.views import UnfoldModelAdminViewMixin

from core.permissions import is_store_admin

from checkout.models import Order, OrderItem, OrderPayment, ShoppingCart
from inventory.models import ProductStock

COMPLETED = OrderPayment.StatusChoices.COMPLETED

# SVG chart geometry (the SVG is stretched with preserveAspectRatio="none")
CHART_W, CHART_H = 1000, 300
CHART_TOP, CHART_BOTTOM = 14, 4

ORDER_TONE = {
    "payment": "info", "pending": "warning", "processing": "warning",
    "shipped": "primary", "delivered": "success", "cancelled": "danger",
}

def _dec(value):
    return Decimal(str(value or 0))


def _money(value, decimals=2):
    return f"${float(value):,.{decimals}f}"


def _compact(value):
    value = float(value)
    for limit, suffix in ((1e9, "B"), (1e6, "M"), (1e3, "k")):
        if abs(value) >= limit:
            return f"${value / limit:.1f}".rstrip("0").rstrip(".") + suffix
    return f"${value:,.0f}"


def _fmt_day(day):
    return f"{day.strftime('%b')} {day.day}"


def _local_start(day):
    return timezone.make_aware(datetime.combine(day, time.min))


def _initials(name, fallback=""):
    parts = [p for p in (name or "").split() if p]
    if len(parts) >= 2:
        return (parts[0][0] + parts[-1][0]).upper()
    if parts:
        return parts[0][:2].upper()
    return (fallback[:1] or "?").upper()


def _delta(current, previous):
    current, previous = _dec(current), _dec(previous)

    if previous == 0:
        if current == 0:
            return {"text": "—", "tone": "flat"}
        return {"text": str(_("New")), "tone": "up"}

    pct = (current - previous) / previous * 100
    return {
        "text": f"{pct:+.1f}%",
        "tone": "up" if pct > 0 else "down" if pct < 0 else "flat",
    }


def _ratio(part, whole):
    return (part / whole * 100) if whole else 0




def _nice_ceiling(value):
    if value <= 0:
        return 1
    base = 10 ** math.floor(math.log10(value))
    for step in (1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10):
        if value <= step * base:
            return step * base
    return 10 * base


def _smooth_path(points):
    """Cubic path with horizontal tangents: smooth, never overshoots."""
    if not points:
        return ""
    d = [f"M{points[0][0]:.2f} {points[0][1]:.2f}"]
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        mid = (x0 + x1) / 2
        d.append(f"C{mid:.2f} {y0:.2f} {mid:.2f} {y1:.2f} {x1:.2f} {y1:.2f}")
    return " ".join(d)


def _chart_points(values, ceiling):
    inner = CHART_H - CHART_TOP - CHART_BOTTOM
    step = CHART_W / (len(values) - 1)
    return [
        (i * step, CHART_TOP + inner * (1 - (float(v) / ceiling)))
        for i, v in enumerate(values)
    ]


def _sparkline(values, width=96, height=32, pad=3):
    values = [float(v) for v in values]
    low, high = min(values), max(values)
    span = high - low
    step = width / (len(values) - 1)
    points = [
        (
            i * step,
            height / 2 if not span else pad + (height - 2 * pad) * (1 - (v - low) / span),
        )
        for i, v in enumerate(values)
    ]
    line = _smooth_path(points)
    return {"line": line, "area": f"{line} L{width} {height} L0 {height} Z"}




def _payments(start, end):
    return OrderPayment.objects.filter(
        status=COMPLETED, paid_at__gte=start, paid_at__lt=end
    )


def _paid_items(w):
    return OrderItem.objects.filter(
        order__payment__status=COMPLETED,
        order__payment__paid_at__gte=w["start"],
        order__payment__paid_at__lt=w["end"],
    )


def _by_day(qs, field, **aggregates):
    rows = (
        qs.annotate(day=TruncDate(field))
        .order_by()
        .values("day")
        .annotate(**aggregates)
    )
    return {row["day"]: row for row in rows}


class AnalyticsDashboardView(UnfoldModelAdminViewMixin, TemplateView):
    title = _("Commerce Analytics")
    permission_required = ()
    template_name = "admin/analytics.html"

    PERIODS = {
        7: _("7 days"),
        30: _("30 days"),
        90: _("90 days"),
        365: _("12 months"),
    }

    def has_permission(self):
        return is_store_admin(self.request.user)

    def _is_htmx(self):
        headers = self.request.headers
        return (
            headers.get("HX-Request") == "true"
            and headers.get("HX-History-Restore-Request") != "true"
        )

    def _orders_only(self):
        return self._is_htmx() and self.request.GET.get("panel") == "orders"

    def get_template_names(self):
        if self._orders_only():
            return ["admin/analytics/_orders.html"]
        if self._is_htmx():
            return ["admin/analytics/_body.html"]
        return [self.template_name]

    def render_to_response(self, context, **response_kwargs):
        response = super().render_to_response(context, **response_kwargs)
        patch_vary_headers(response, ["HX-Request"])
        return response

    # ------------------------------------------------------------------
    # Period window
    # ------------------------------------------------------------------

    def _period(self):
        try:
            period = int(self.request.GET.get("period", 30))
        except (TypeError, ValueError):
            return 30
        return period if period in self.PERIODS else 30

    @staticmethod
    def _window(period):
        today = timezone.localdate()
        start_date = today - timedelta(days=period - 1)
        prev_start_date = start_date - timedelta(days=period)
        start = _local_start(start_date)

        return {
            "start": start,
            "end": timezone.now(),
            "prev_start": _local_start(prev_start_date),
            "prev_end": start,
            "days": [start_date + timedelta(days=i) for i in range(period)],
            "prev_days": [prev_start_date + timedelta(days=i) for i in range(period)],
            "range_label": f"{_fmt_day(start_date)} – {_fmt_day(today)}, {today.year}",
            "prev_range_label": (
                f"{_fmt_day(prev_start_date)} – "
                f"{_fmt_day(start_date - timedelta(days=1))}"
            ),
        }

    # ------------------------------------------------------------------
    # Context
    # ------------------------------------------------------------------

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        period = self._period()
        w = self._window(period)

        context.update(
            title=self.title,
            period=period,
            base_url=self.request.path,
            periods=[
                {"value": value, "label": str(label), "active": value == period}
                for value, label in self.PERIODS.items()
            ],
        )

        if self._orders_only():
            context.update(self._orders_rows(w))
            return context

        revenue, chart, kpis = self._revenue(w)
        funnel, operations = self._funnel(w)
        stock, stock_counts = self._inventory()

        context.update(
            range_label=w["range_label"],
            prev_range_label=w["prev_range_label"],
            revenue=revenue,
            chart=chart,
            kpis=kpis,
            funnel=funnel,
            operations=operations,
            categories=self._categories(w),
            payment_mix=self._payment_mix(w),
            top_products=self._top_products(w),
            stock_watch=stock,
            stock_counts=stock_counts,
            countries=self._countries(w),
            customers=self._customers(w),
            attention_items=self._attention(w, stock_counts),
            generated_at=timezone.localtime(),
            inventory_url=reverse("admin:inventory_productstock_changelist"),
            orders_url=reverse("admin:checkout_order_changelist"),
        )
        context.update(self._orders_rows(w, tabs=True))
        return context

    # ------------------------------------------------------------------
    # Revenue hero, chart and KPI stack
    # ------------------------------------------------------------------

    def _revenue(self, w):
        cur = _payments(w["start"], w["end"])
        prev = _payments(w["prev_start"], w["prev_end"])

        cur_days = _by_day(
            cur,
            "paid_at",
            revenue=Sum("amount"),
            orders=Count("id"),
            customers=Count("order__user_id", distinct=True),
        )
        prev_days = _by_day(prev, "paid_at", revenue=Sum("amount"))

        days, prev_day_list = w["days"], w["prev_days"]
        revenue = [_dec(cur_days.get(d, {}).get("revenue")) for d in days]
        orders = [cur_days.get(d, {}).get("orders", 0) for d in days]
        customers = [cur_days.get(d, {}).get("customers", 0) for d in days]
        prev_revenue = [_dec(prev_days.get(d, {}).get("revenue")) for d in prev_day_list]
        aov = [r / o if o else Decimal("0") for r, o in zip(revenue, orders)]

        total = sum(revenue, Decimal("0"))
        prev_total = sum(prev_revenue, Decimal("0"))
        n_orders, prev_orders = sum(orders), prev.count()
        n_customers = cur.order_by().values("order__user_id").distinct().count()
        prev_customers = prev.order_by().values("order__user_id").distinct().count()
        total_aov = total / n_orders if n_orders else Decimal("0")
        prev_aov = prev_total / prev_orders if prev_orders else Decimal("0")

        # --- chart ---
        ceiling = _nice_ceiling(float(max(max(revenue), max(prev_revenue))))
        cur_pts = _chart_points(revenue, ceiling)
        prev_pts = _chart_points(prev_revenue, ceiling)
        line = _smooth_path(cur_pts)

        inner = CHART_H - CHART_TOP - CHART_BOTTOM
        ticks = []
        for i in range(5):
            frac = i / 4
            y = CHART_TOP + inner * (1 - frac)
            ticks.append(
                {"pct": f"{y / CHART_H * 100:.2f}", "label": _compact(ceiling * frac)}
            )

        n = len(days)
        label_idx = sorted({round(i * (n - 1) / 5) for i in range(6)})

        chart = {
            "line": line,
            "area": f"{line} L{CHART_W} {CHART_H} L0 {CHART_H} Z",
            "prev_line": _smooth_path(prev_pts),
            "ticks": ticks,
            "x_labels": [_fmt_day(days[i]) for i in label_idx],
            "points": [
                {
                    "label": _fmt_day(days[i]),
                    "rev": float(revenue[i]),
                    "orders": orders[i],
                    "prev": float(prev_revenue[i]),
                    "prev_label": _fmt_day(prev_day_list[i]),
                    "y": round(cur_pts[i][1] / CHART_H * 100, 2),
                    "py": round(prev_pts[i][1] / CHART_H * 100, 2),
                }
                for i in range(n)
            ],
        }

        whole, _sep, cents = f"{total:,.2f}".partition(".")
        hero = {
            "whole": f"${whole}",
            "cents": cents,
            "delta": _delta(total, prev_total),
            "previous": _money(prev_total, 0),
        }

        kpis = [
            {
                "label": _("Paid orders"),
                "value": f"{n_orders:,}",
                "delta": _delta(n_orders, prev_orders),
                "spark": _sparkline(orders),
            },
            {
                "label": _("Average order value"),
                "value": _money(total_aov),
                "delta": _delta(total_aov, prev_aov),
                "spark": _sparkline(aov),
            },
            {
                "label": _("Paying customers"),
                "value": f"{n_customers:,}",
                "delta": _delta(n_customers, prev_customers),
                "spark": _sparkline(customers),
            },
        ]
        return hero, chart, kpis

    # ------------------------------------------------------------------
    # Funnel + operations strip
    # ------------------------------------------------------------------

    def _funnel(self, w):
        created = Order.objects.filter(
            created_at__gte=w["start"], created_at__lt=w["end"]
        )
        carts = (
            ShoppingCart.objects.filter(
                updated_at__gte=w["start"],
                updated_at__lt=w["end"],
                items__isnull=False,
            )
            .distinct()
            .count()
        )
        placed = created.count()
        paid_qs = created.filter(payment__status=COMPLETED)
        paid = paid_qs.count()
        delivered = paid_qs.filter(status=Order.StatusChoices.DELIVERED).count()

        raw = [
            (_("Carts with items"), carts),
            (_("Orders placed"), placed),
            (_("Orders paid"), paid),
            (_("Orders delivered"), delivered),
        ]
        top = max(v for _label, v in raw) or 1

        steps = []
        for i, (label, value) in enumerate(raw):
            rate = None
            if i and raw[i - 1][1] and value <= raw[i - 1][1]:
                rate = f"{_ratio(value, raw[i - 1][1]):.0f}%"
            steps.append(
                {
                    "label": label,
                    "value": f"{value:,}",
                    "width": f"{_ratio(value, top):.1f}",
                    "rate": rate,
                    "tone": i + 1,
                }
            )

        awaiting = Order.objects.filter(
            payment__status=COMPLETED,
            payment__paid_at__gte=w["start"],
            payment__paid_at__lt=w["end"],
            status__in=[Order.StatusChoices.PENDING, Order.StatusChoices.PROCESSING],
        ).count()

        operations = [
            {
                "label": _("Payment rate"),
                "value": f"{_ratio(paid, placed):.0f}%",
                "note": f"{paid:,} of {placed:,} orders paid",
            },
            {
                "label": _("Awaiting fulfilment"),
                "value": f"{awaiting:,}",
                "note": _("Paid, not yet shipped"),
            },
            {
                "label": _("Delivery rate"),
                "value": f"{_ratio(delivered, paid):.0f}%",
                "note": f"{delivered:,} delivered",
            },
        ]
        return steps, operations

    # ------------------------------------------------------------------
    # Category donut
    # ------------------------------------------------------------------

    def _categories(self, w):
        rows = list(
            _paid_items(w)
            .annotate(
                cat=Coalesce(
                    "product__category__name",
                    Value(str(_("Uncategorised"))),
                    output_field=CharField(),
                )
            )
            .order_by()
            .values("cat")
            .annotate(revenue=Sum("total_price"), units=Sum("quantity"))
            .order_by("-revenue")
        )

        entries = [(r["cat"], _dec(r["revenue"])) for r in rows[:5]]
        rest = sum((_dec(r["revenue"]) for r in rows[5:]), Decimal("0"))
        if rest:
            entries.append((str(_("Other")), rest))

        total = sum((rev for _name, rev in entries), Decimal("0"))
        segments, cumulative = [], 0.0

        for i, (name, rev) in enumerate(entries):
            share = float(rev / total * 100) if total else 0.0
            dash = max(share - (0.8 if share > 3 else 0), 0)
            segments.append(
                {
                    "name": name,
                    "revenue": _money(rev, 0),
                    "share": f"{share:.0f}%",
                    "dash": f"{dash:.2f}",
                    "rest": f"{100 - dash:.2f}",
                    "offset": f"{-cumulative:.2f}",
                    "tone": i + 1,
                }
            )
            cumulative += share

        return {"segments": segments, "total": _compact(total)}

    # ------------------------------------------------------------------
    # Payment mix
    # ------------------------------------------------------------------

    def _payment_mix(self, w):
        rows = list(
            _payments(w["start"], w["end"])
            .order_by()
            .values("method")
            .annotate(revenue=Sum("amount"), orders=Count("id"))
            .order_by("-revenue")
        )
        total = sum((_dec(r["revenue"]) for r in rows), Decimal("0"))

        return [
            {
                "name": (r["method"] or str(_("Unknown"))).replace("_", " ").title(),
                "revenue": _money(r["revenue"], 0),
                "orders": ngettext("%(n)d order", "%(n)d orders", r["orders"])
                % {"n": r["orders"]},
                "share": f"{_ratio(_dec(r['revenue']), total):.1f}",
                "tone": min(i + 1, 6),
            }
            for i, r in enumerate(rows)
        ]

    # ------------------------------------------------------------------
    # Top products
    # ------------------------------------------------------------------

    def _top_products(self, w):
        rows = list(
            _paid_items(w)
            .filter(product__isnull=False)
            .order_by()
            .values("product__name", "product__sku")
            .annotate(units=Sum("quantity"), revenue=Sum("total_price"))
            .order_by("-revenue")[:6]
        )
        top = _dec(rows[0]["revenue"]) if rows else Decimal("0")

        return [
            {
                "rank": i + 1,
                "name": r["product__name"],
                "sku": r["product__sku"],
                "units": f"{r['units']:,}",
                "revenue": _money(r["revenue"]),
                "width": f"{_ratio(_dec(r['revenue']), top):.1f}",
            }
            for i, r in enumerate(rows)
        ]

    # ------------------------------------------------------------------
    # Inventory watch (uses each product's own low-stock threshold)
    # ------------------------------------------------------------------

    def _inventory(self):
        stock = ProductStock.objects.filter(product__is_active=True).annotate(
            avail=ExpressionWrapper(
                F("quantity") - F("reserved_quantity"), output_field=IntegerField()
            )
        )
        out_q = Q(avail__lte=0) | Q(is_available=False)
        low_q = Q(is_available=True, avail__gt=0, avail__lte=F("low_stock_threshold"))

        counts = stock.aggregate(
            out=Count("id", filter=out_q),
            low=Count("id", filter=low_q),
            total=Count("id"),
        )
        counts["healthy"] = counts["total"] - counts["out"] - counts["low"]

        watch = []
        for item in (
            stock.filter(out_q | low_q)
            .select_related("product")
            .order_by("avail", "product__name")[:6]
        ):
            avail = max(item.avail, 0)
            is_out = avail == 0 or not item.is_available
            scale = max(item.low_stock_threshold * 2, 1)
            watch.append(
                {
                    "name": item.product.name,
                    "sku": item.product.sku,
                    "avail": f"{avail:,}",
                    "fill": f"{min(_ratio(avail, scale), 100):.0f}",
                    "tone": "danger" if is_out else "warning",
                    "status": _("Out of stock") if is_out else _("Running low"),
                }
            )
        return watch, counts

    # ------------------------------------------------------------------
    # Where orders ship
    # ------------------------------------------------------------------

    def _countries(self, w):
        rows = list(
            Order.objects.filter(
                payment__status=COMPLETED,
                payment__paid_at__gte=w["start"],
                payment__paid_at__lt=w["end"],
            )
            .order_by()
            .values("delivery_address__country")
            .annotate(orders=Count("id"), revenue=Sum("total_price"))
            .order_by("-revenue")[:6]
        )
        top = _dec(rows[0]["revenue"]) if rows else Decimal("0")

        return [
            {
                "name": r["delivery_address__country"] or str(_("Unknown")),
                "orders": f"{r['orders']:,}",
                "revenue": _money(r["revenue"], 0),
                "width": f"{_ratio(_dec(r['revenue']), top):.1f}",
            }
            for r in rows
        ]

    # ------------------------------------------------------------------
    # Customers: new vs returning, top spenders
    # ------------------------------------------------------------------

    def _customers(self, w):
        cur = _payments(w["start"], w["end"])
        ids = set(cur.order_by().values_list("order__user_id", flat=True))

        returning = 0
        if ids:
            returning = (
                OrderPayment.objects.filter(
                    status=COMPLETED,
                    paid_at__lt=w["start"],
                    order__user_id__in=ids,
                )
                .order_by()
                .values("order__user_id")
                .distinct()
                .count()
            )
        new = len(ids) - returning

        spenders = (
            cur.order_by()
            .values(
                "order__user_id",
                "order__user__first_name",
                "order__user__last_name",
                "order__user__email",
            )
            .annotate(spent=Sum("amount"), orders=Count("id"))
            .order_by("-spent")[:5]
        )

        top = []
        for row in spenders:
            name = f"{row['order__user__first_name']} {row['order__user__last_name']}".strip()
            email = row["order__user__email"]
            top.append(
                {
                    "name": name or email,
                    "email": email,
                    "initials": _initials(name, email),
                    "orders": ngettext("%(n)d order", "%(n)d orders", row["orders"])
                    % {"n": row["orders"]},
                    "spent": _money(row["spent"]),
                }
            )

        return {
            "new": f"{new:,}",
            "returning": f"{returning:,}",
            "new_pct": f"{_ratio(new, len(ids)):.1f}",
            "returning_pct": f"{_ratio(returning, len(ids)):.1f}",
            "total": len(ids),
            "top": top,
        }

    # ------------------------------------------------------------------
    # Attention strip (every chip links to the filtered admin list)
    # ------------------------------------------------------------------

    def _attention(self, w, stock_counts):
        items = []

        failed = OrderPayment.objects.filter(
            created_at__gte=w["start"],
            created_at__lt=w["end"],
            status=OrderPayment.StatusChoices.FAILED,
        ).count()
        if failed:
            items.append(
                {
                    "value": failed,
                    "label": ngettext("failed payment", "failed payments", failed),
                    "tone": "danger",
                    "url": reverse("admin:checkout_orderpayment_changelist")
                    + "?status__exact=FAILED",
                }
            )

        paid_pending = Order.objects.filter(
            payment__status=COMPLETED,
            payment__paid_at__gte=w["start"],
            payment__paid_at__lt=w["end"],
            status=Order.StatusChoices.PENDING,
        ).count()
        if paid_pending:
            items.append(
                {
                    "value": paid_pending,
                    "label": ngettext(
                        "paid order to review", "paid orders to review", paid_pending
                    ),
                    "tone": "warning",
                    "url": reverse("admin:checkout_order_changelist")
                    + "?status__exact=pending",
                }
            )

        if stock_counts["out"]:
            items.append(
                {
                    "value": stock_counts["out"],
                    "label": ngettext(
                        "product out of stock", "products out of stock", stock_counts["out"]
                    ),
                    "tone": "danger",
                    "url": reverse("admin:inventory_productstock_changelist"),
                }
            )

        refunded = OrderPayment.objects.filter(
            created_at__gte=w["start"],
            created_at__lt=w["end"],
            status=OrderPayment.StatusChoices.REFUNDED,
        ).aggregate(total=Sum("amount"))["total"]
        if refunded:
            items.append(
                {
                    "value": _money(refunded, 0),
                    "label": _("refunded"),
                    "tone": "neutral",
                    "url": reverse("admin:checkout_orderpayment_changelist")
                    + "?status__exact=REFUNDED",
                }
            )
        return items

    # ------------------------------------------------------------------
    # Recent orders panel (also served alone to HTMX filter requests)
    # ------------------------------------------------------------------

    def _orders_rows(self, w, tabs=False):
        valid = {value for value, _label in Order.StatusChoices.choices}
        status = self.request.GET.get("status", "")
        status = status if status in valid else ""
        query = self.request.GET.get("q", "").strip()

        in_period = Order.objects.filter(
            created_at__gte=w["start"], created_at__lt=w["end"]
        )
        qs = in_period
        if status:
            qs = qs.filter(status=status)
        if query:
            search = (
                Q(user__email__icontains=query)
                | Q(user__first_name__icontains=query)
                | Q(user__last_name__icontains=query)
            )
            if query.lstrip("#").isdigit():
                search |= Q(id=int(query.lstrip("#")))
            qs = qs.filter(search)


        payment_tone = {
            OrderPayment.StatusChoices.PENDING: "warning",
            OrderPayment.StatusChoices.COMPLETED: "success",
            OrderPayment.StatusChoices.FAILED: "danger",
            OrderPayment.StatusChoices.REFUNDED: "info",
        }

        rows = []
        for order in qs.select_related("user", "payment", "shipment").order_by(
            "-created_at"
        )[:10]:
            payment = getattr(order, "payment", None)
            shipment = getattr(order, "shipment", None)
            name = order.user.get_full_name().strip()
            rows.append(
                {
                    "id": order.id,
                    "url": reverse("admin:checkout_order_change", args=[order.id]),
                    "name": name if name != order.user.email else order.user.email,
                    "email": order.user.email,
                    "initials": _initials(name, order.user.email),
                    "total": _money(order.total_price),
                    "status": order.get_status_display(),
                    "status_tone": ORDER_TONE.get(order.status, "neutral"),
                    "payment": payment.get_status_display() if payment else _("No payment"),
                    "payment_tone": payment_tone.get(payment.status, "neutral")
                    if payment
                    else "neutral",
                    "shipment": shipment.get_status_display() if shipment else "—",
                    "created": order.created_at,
                }
            )

        data = {
            "order_rows": rows,
            "order_count": qs.count(),
            "active_status": status,
            "q": query,
        }

        if tabs:
            counts = dict(
                in_period.order_by()
                .values_list("status")
                .annotate(n=Count("id"))
            )
            data["order_tabs"] = [
                {"value": "", "label": _("All"), "count": sum(counts.values())}
            ] + [
                {"value": value, "label": label, "count": counts.get(value, 0)}
                for value, label in Order.StatusChoices.choices
            ]
        return data


def analytics_view(request, *args, **kwargs):
    view = AnalyticsDashboardView.as_view(model_admin=ModelAdmin(Order, admin.site))
    return admin.site.admin_view(view)(request, *args, **kwargs)