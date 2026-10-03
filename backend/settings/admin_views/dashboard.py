from datetime import timedelta
from decimal import Decimal

from django.contrib import admin
from django.db.models import Count, ExpressionWrapper, F, IntegerField, Sum
from django.db.models.functions import TruncDate
from django.http import HttpResponseForbidden
from django.shortcuts import get_object_or_404
from django.urls import reverse
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.views.generic import TemplateView
from unfold.admin import ModelAdmin
from unfold.views import UnfoldModelAdminViewMixin

from account.models import User
from checkout.models import Order, OrderPayment, OrderShipment
from inventory.models import ProductStock
from settings.models import Contact
from settings.admin_views.analytics import (
    _dec, _delta, _fmt_day, _initials, _local_start, _money, _ratio,
)

COMPLETED = OrderPayment.StatusChoices.COMPLETED

ORDER_TONE = {
    "payment": "info", "pending": "warning", "processing": "warning",
    "shipped": "primary", "delivered": "success", "cancelled": "danger",
}


class DashboardView(UnfoldModelAdminViewMixin, TemplateView):
    title = _("Dashboard")
    permission_required = ()
    template_name = "admin/dashboard.html"
    PERIODS = (7, 30, 90)

    # --- HTMX plumbing: full page / body (period) / contacts panel ---------
    def _htmx(self):
        h = self.request.headers
        return (h.get("HX-Request") == "true"
                and h.get("HX-History-Restore-Request") != "true")

    def _panel(self):
        return self.request.GET.get("panel") if self._htmx() else None

    def get_template_names(self):
        if self._panel() == "contacts":
            return ["admin/dashboard/_contacts.html"]
        if self._htmx():
            return ["admin/dashboard/_body.html"]
        return [self.template_name]

    def post(self, request, *args, **kwargs):
        if not request.user.has_perm("settings.change_contact"):
            return HttpResponseForbidden()
        get_object_or_404(Contact, pk=request.POST.get("id")).mark_as_responded()
        return self.get(request, *args, **kwargs)

    def _period(self):
        try:
            p = int(self.request.GET.get("period", 30))
        except (TypeError, ValueError):
            return 30
        return p if p in self.PERIODS else 30

    # --- Context ------------------------------------------------------------
    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        user = self.request.user
        ctx.update(
            title=self.title,
            base_url=self.request.path,
            period=self._period(),
            periods=[{"value": p, "active": p == self._period()} for p in self.PERIODS],
            can_reply=user.has_perm("settings.change_contact"),
            now=timezone.localtime(),
        )
        ctx.update(self._contacts())
        if self._panel() == "contacts":
            return ctx

        period = self._period()
        today = timezone.localdate()
        start = _local_start(today - timedelta(days=period - 1))
        prev_start = _local_start(today - timedelta(days=2 * period - 1))
        end = timezone.now()

        def paid(a, b):
            return OrderPayment.objects.filter(
                status=COMPLETED, paid_at__gte=a, paid_at__lt=b)

        cur = paid(start, end).aggregate(rev=Sum("amount"), n=Count("id"))
        prv = paid(prev_start, start).aggregate(rev=Sum("amount"), n=Count("id"))
        customers = User.objects.filter(is_staff=False, date_joined__gte=start).count()
        prev_customers = User.objects.filter(
            is_staff=False, date_joined__gte=prev_start, date_joined__lt=start).count()

        daily = {
            r["d"]: _dec(r["t"])
            for r in paid(start, end).annotate(d=TruncDate("paid_at"))
            .order_by().values("d").annotate(t=Sum("amount"))
        }
        days = [today - timedelta(days=period - 1 - i) for i in range(period)]
        values = [daily.get(d, Decimal("0")) for d in days]
        top = max(values) or Decimal("1")
        bars = [
            {"label": _fmt_day(d), "value": _money(v, 0),
             "h": max(round(float(v / top) * 100), 3 if v else 1)}
            for d, v in zip(days, values)
        ]

        ctx.update(
            revenue=_money(_dec(cur["rev"]), 0),
            revenue_delta=_delta(cur["rev"], prv["rev"]),
            orders=cur["n"], orders_delta=_delta(cur["n"], prv["n"]),
            customers=customers, customers_delta=_delta(customers, prev_customers),
            aov=_money(_dec(cur["rev"]) / cur["n"] if cur["n"] else 0, 2),
            bars=bars,
            range_label=f"{_fmt_day(days[0])} – {_fmt_day(days[-1])}",
            recent_orders=self._recent_orders(),
            low_stock=self._low_stock(),
            attention=self._attention(start, end),
            quick=[
                (_("Add product"), "add_box", reverse("admin:inventory_product_add")),
                (_("Orders"), "receipt_long", reverse("admin:checkout_order_changelist")),
                (_("Stock levels"), "warehouse", reverse("admin:inventory_productstock_changelist")),
                (_("Analytics"), "insights", reverse("admin-analytics")),
                (_("Live config"), "tune", reverse("admin:constance_config_changelist")),
            ],
        )
        return ctx

    # --- Pieces -------------------------------------------------------------
    def _contacts(self):
        show = "all" if self.request.GET.get("show") == "all" else "open"
        base = Contact.objects.filter(is_active=True)
        qs = base if show == "all" else base.filter(has_responded=False)
        items = []
        for c in qs.order_by("has_responded", "-created_at")[:6]:
            items.append({
                "id": c.id, "name": c.name, "email": c.email, "subject": c.subject,
                "message": c.message, "done": c.has_responded,
                "initials": _initials(c.name, c.email),
                "created": timezone.localtime(c.created_at) if c.created_at else None,
            })
        return {
            "contacts": items, "contacts_show": show,
            "contacts_open": base.filter(has_responded=False).count(),
            "contacts_total": base.count(),
            "contacts_url": reverse("admin:settings_contact_changelist"),
        }

    def _recent_orders(self):
        rows = []
        for o in Order.objects.select_related("user", "payment").order_by("-created_at")[:6]:
            name = o.user.get_full_name().strip()
            rows.append({
                "id": o.id, "url": reverse("admin:checkout_order_change", args=[o.id]),
                "name": name, "email": o.user.email,
                "initials": _initials(name, o.user.email),
                "total": _money(o.total_price), "status": o.get_status_display(),
                "tone": ORDER_TONE.get(o.status, "neutral"), "created": o.created_at,
            })
        return rows

    def _low_stock(self):
        qs = ProductStock.objects.filter(product__is_active=True).annotate(
            avail=ExpressionWrapper(F("quantity") - F("reserved_quantity"),
                                    output_field=IntegerField())
        ).filter(avail__lte=F("low_stock_threshold")).select_related("product")
        return [{
            "name": s.product.name, "sku": s.product.sku, "avail": max(s.avail, 0),
            "tone": "danger" if (s.avail <= 0 or not s.is_available) else "warning",
            "status": _("Out of stock") if (s.avail <= 0 or not s.is_available) else _("Running low"),
            "fill": min(round(_ratio(max(s.avail, 0), max(s.low_stock_threshold * 2, 1))), 100),
        } for s in qs.order_by("avail")[:5]]

    def _attention(self, start, end):
        cl = lambda m, q="": reverse(f"admin:{m}_changelist") + q
        stock = len(self._low_stock())
        rows = [
            (Order.objects.filter(status=Order.StatusChoices.PENDING).count(),
             _("orders to review"), "warning", cl("checkout_order", "?status__exact=pending")),
            (OrderShipment.objects.filter(status="pending").count(),
             _("shipments to send"), "info", cl("checkout_ordershipment", "?status__exact=pending")),
            (OrderPayment.objects.filter(status="FAILED", created_at__gte=start, created_at__lt=end).count(),
             _("failed payments"), "danger", cl("checkout_orderpayment", "?status__exact=FAILED")),
            (stock, _("products low on stock"), "danger", cl("inventory_productstock")),
        ]
        return [{"n": n, "label": l, "tone": t, "url": u} for n, l, t, u in rows if n]


def dashboard_view(request, *args, **kwargs):
    """Replaces the default admin index at /admin/."""
    view = DashboardView.as_view(model_admin=ModelAdmin(Order, admin.site))
    return admin.site.admin_view(view)(request, *args, **kwargs)