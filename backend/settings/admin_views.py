import json
from datetime import datetime, time, timedelta
from decimal import Decimal

from django.db.models import (
    Count,
    ExpressionWrapper,
    F,
    IntegerField,
    Sum,
    Value,
)
from django.db.models.functions import Coalesce, TruncDate
from django.urls import reverse
from django.utils import timezone
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from django.views.generic import TemplateView

from unfold.views import UnfoldModelAdminViewMixin

from checkout.models import (
    Order,
    OrderItem,
    OrderPayment,
    OrderShipment,
)
from inventory.models import ProductStock


class AnalyticsDashboardView(
    UnfoldModelAdminViewMixin,
    TemplateView,
):
    title = _("Commerce Analytics")
    permission_required = ()
    template_name = "admin/analytics.html"

    PERIODS = {
        7: _("7 days"),
        30: _("30 days"),
        90: _("90 days"),
    }

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _local_start(date_value):
        return timezone.make_aware(
            datetime.combine(date_value, time.min)
        )

    @staticmethod
    def _money(value):
        return Decimal(str(value or 0))

    @staticmethod
    def _delta(current, previous):
        current = Decimal(str(current or 0))
        previous = Decimal(str(previous or 0))

        if previous == 0:
            if current == 0:
                return {
                    "text": "—",
                    "class": "fog-delta-neutral",
                }

            return {
                "text": _("New"),
                "class": "fog-delta-positive",
            }

        percentage = (
            (current - previous)
            / previous
            * Decimal("100")
        )

        sign = "+" if percentage >= 0 else ""

        return {
            "text": f"{sign}{percentage:.1f}%",
            "class": (
                "fog-delta-positive"
                if percentage >= 0
                else "fog-delta-negative"
            ),
        }

    @staticmethod
    def _stock_queryset():
        """
        available_quantity is a Python property.

        Database fields:
            quantity
            reserved_quantity

        Calculate actual availability in SQL.
        """
        return ProductStock.objects.annotate(
            available_units=ExpressionWrapper(
                F("quantity")
                - Coalesce(
                    F("reserved_quantity"),
                    Value(0),
                ),
                output_field=IntegerField(),
            )
        )

    # ------------------------------------------------------------------
    # Main dashboard
    # ------------------------------------------------------------------

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        # ==============================================================
        # Period
        # ==============================================================

        try:
            period = int(
                self.request.GET.get("period", 30)
            )
        except (TypeError, ValueError):
            period = 30

        if period not in self.PERIODS:
            period = 30

        today = timezone.localdate()

        current_start_date = (
            today - timedelta(days=period - 1)
        )

        current_start = self._local_start(
            current_start_date
        )

        current_end = timezone.now()

        previous_start = (
            current_start
            - timedelta(days=period)
        )

        previous_end = current_start

        period_label = self.PERIODS[period]

        # ==============================================================
        # Querysets
        # ==============================================================

        current_orders = Order.objects.filter(
            created_at__gte=current_start,
            created_at__lt=current_end,
        )

        previous_orders = Order.objects.filter(
            created_at__gte=previous_start,
            created_at__lt=previous_end,
        )

        current_payments = OrderPayment.objects.filter(
            paid_at__gte=current_start,
            paid_at__lt=current_end,
            status=OrderPayment.StatusChoices.COMPLETED,
        )

        previous_payments = OrderPayment.objects.filter(
            paid_at__gte=previous_start,
            paid_at__lt=previous_end,
            status=OrderPayment.StatusChoices.COMPLETED,
        )

        # ==============================================================
        # Revenue
        # ==============================================================

        current_revenue = self._money(
            current_payments.aggregate(
                total=Sum("amount")
            )["total"]
        )

        previous_revenue = self._money(
            previous_payments.aggregate(
                total=Sum("amount")
            )["total"]
        )

        # ==============================================================
        # Paid orders
        # ==============================================================

        current_paid_orders = current_payments.count()
        previous_paid_orders = previous_payments.count()

        # ==============================================================
        # Average order value
        # ==============================================================

        current_aov = (
            current_revenue / current_paid_orders
            if current_paid_orders
            else Decimal("0.00")
        )

        previous_aov = (
            previous_revenue / previous_paid_orders
            if previous_paid_orders
            else Decimal("0.00")
        )

        # ==============================================================
        # Customers
        # ==============================================================

        current_customers = (
            current_payments
            .values("order__user_id")
            .distinct()
            .count()
        )

        previous_customers = (
            previous_payments
            .values("order__user_id")
            .distinct()
            .count()
        )

        # ==============================================================
        # Order metrics
        # ==============================================================

        current_total_orders = current_orders.count()

        current_paid_rate = (
            current_paid_orders
            / current_total_orders
            * 100
            if current_total_orders
            else 0
        )

        # ==============================================================
        # Fulfilment
        # ==============================================================

        paid_orders_in_period = Order.objects.filter(
            payment__status=OrderPayment.StatusChoices.COMPLETED,
            payment__paid_at__gte=current_start,
            payment__paid_at__lt=current_end,
        )

        pending_fulfilment = (
            paid_orders_in_period
            .filter(
                status__in=[
                    Order.StatusChoices.PENDING,
                    Order.StatusChoices.PROCESSING,
                ],
            )
            .count()
        )

        delivered_orders = paid_orders_in_period.filter(
            status=Order.StatusChoices.DELIVERED
        ).count()

        delivered_rate = (
            delivered_orders
            / current_paid_orders
            * 100
            if current_paid_orders
            else 0
        )

        # ==============================================================
        # Failed payments
        # ==============================================================

        failed_payments = OrderPayment.objects.filter(
            created_at__gte=current_start,
            created_at__lt=current_end,
            status=OrderPayment.StatusChoices.FAILED,
        ).count()

        # ==============================================================
        # Refunds
        # ==============================================================

        refunded_payments = OrderPayment.objects.filter(
            created_at__gte=current_start,
            created_at__lt=current_end,
            status=OrderPayment.StatusChoices.REFUNDED,
        )

        refunded_amount = self._money(
            refunded_payments.aggregate(
                total=Sum("amount")
            )["total"]
        )

        # ==============================================================
        # Shipment metrics
        # ==============================================================

        current_shipments = OrderShipment.objects.filter(
            order__created_at__gte=current_start,
            order__created_at__lt=current_end,
        )

        shipment_status_rows = (
            current_shipments
            .values("status")
            .annotate(count=Count("id"))
        )

        shipment_counts = {
            row["status"]: row["count"]
            for row in shipment_status_rows
        }

        shipment_pending = shipment_counts.get(
            OrderShipment.StatusChoices.PENDING,
            0,
        )

        shipment_in_transit = shipment_counts.get(
            OrderShipment.StatusChoices.IN_TRANSIT,
            0,
        )

        shipment_delivered = shipment_counts.get(
            OrderShipment.StatusChoices.DELIVERED,
            0,
        )

        # ==============================================================
        # Revenue trend
        # ==============================================================

        # ==============================================================
        # Revenue trend
        # ==============================================================

        days = [
            current_start_date + timedelta(days=i)
            for i in range(period)
        ]

        revenue_by_day = {
            day: Decimal("0.00")
            for day in days
        }

        paid_orders_by_day = {
            day: 0
            for day in days
        }

        revenue_rows = (
            current_payments
            .annotate(
                day=TruncDate("paid_at")
            )
            .values("day")
            .annotate(
                revenue=Sum("amount"),
                orders=Count("id"),
            )
            .order_by("day")
        )

        for row in revenue_rows:
            day = row["day"]

            if day in revenue_by_day:
                revenue_by_day[day] = self._money(
                    row["revenue"]
                )

                paid_orders_by_day[day] = row["orders"]

        trend_labels = [
            day.strftime("%b %d")
            for day in days
        ]

        trend_revenue = [
            float(revenue_by_day[day])
            for day in days
        ]

        trend_orders = [
            paid_orders_by_day[day]
            for day in days
        ]

        revenue_chart = {
            "labels": trend_labels,
            "datasets": [
                {
                    "label": str(_("Revenue")),
                    "data": trend_revenue,

                    "borderColor": "var(--color-primary-600)",
                    "backgroundColor": "rgba(12, 110, 153, 0.10)",

                    "borderWidth": 2.5,

                    "pointRadius": 0,
                    "pointHoverRadius": 5,

                    "fill": True,
                    "tension": 0.4,

                    "maxTicksXLimit": (
                        7 if period == 7 else 12
                    ),

                    "displayYAxis": True,
                    "suffixYAxis": "$",
                }
            ],
        }

        # ==============================================================
        # Payment method mix
        # ==============================================================

        payment_methods = (
            current_payments
            .values("method")
            .annotate(
                revenue=Sum("amount"),
                orders=Count("id"),
            )
            .order_by("-revenue")
        )

        payment_labels = []
        payment_values = []

        for row in payment_methods:
            method = (
                row["method"]
                or _("Unknown")
            )

            payment_labels.append(
                method
                .replace("_", " ")
                .title()
            )

            payment_values.append(
                float(row["revenue"] or 0)
            )

        payment_chart = {
            "labels": (
                payment_labels
                or [str(_("No paid orders"))]
            ),
            "datasets": [
                {
                    "label": str(_("Revenue")),
                    "data": (
                        payment_values
                        or [0]
                    ),
                    "backgroundColor": (
                        "var(--color-primary-600)"
                    ),
                    "borderRadius": 6,
                    "barThickness": 22,
                    "displayYAxis": True,
                    "suffixYAxis": "$",
                }
            ],
        }

        payment_chart_options = {
            "indexAxis": "y",
            "plugins": {
                "legend": {
                    "display": False,
                },
            },
            "scales": {
                "x": {
                    "beginAtZero": True,
                },
            },
        }

        # ==============================================================
        # Order pipeline
        # ==============================================================

        status_rows = (
            current_orders
            .values("status")
            .annotate(count=Count("id"))
        )

        status_counts = {
            row["status"]: row["count"]
            for row in status_rows
        }

        pipeline_labels = []
        pipeline_values = []

        for status, label in Order.StatusChoices.choices:
            pipeline_labels.append(
                str(label)
            )

            pipeline_values.append(
                status_counts.get(
                    status,
                    0,
                )
            )

        pipeline_chart = {
            "labels": pipeline_labels,
            "datasets": [
                {
                    "label": str(_("Orders")),
                    "data": pipeline_values,
                    "backgroundColor": (
                        "var(--color-primary-600)"
                    ),
                    "borderRadius": 6,
                    "barThickness": 22,
                }
            ],
        }

        pipeline_chart_options = {
            "indexAxis": "y",
            "plugins": {
                "legend": {
                    "display": False,
                },
            },
            "scales": {
                "x": {
                    "beginAtZero": True,
                    "ticks": {
                        "precision": 0,
                    },
                },
            },
        }

        # ==============================================================
        # Top products
        # ==============================================================

        top_products = (
            OrderItem.objects
            .filter(
                product__isnull=False,
                order__payment__status=(
                    OrderPayment.StatusChoices.COMPLETED
                ),
                order__payment__paid_at__gte=current_start,
                order__payment__paid_at__lt=current_end,
            )
            .values(
                "product_id",
                "product__name",
                "product__sku",
            )
            .annotate(
                units=Sum("quantity"),
                revenue=Sum("total_price"),
            )
            .order_by("-revenue")[:8]
        )

        product_rows = []

        for product in top_products:
            product_rows.append([
                {
                    "content": (
                        product["product__name"]
                        or _("Unknown product")
                    ),
                    "class": "fog-table-primary",
                },
                {
                    "content": (
                        product["product__sku"]
                        or "—"
                    ),
                    "class": "fog-table-mono",
                },
                {
                    "content": (
                        f'{product["units"]:,}'
                    ),
                    "class": "fog-table-number",
                },
                {
                    "content": (
                        f'${float(product["revenue"] or 0):,.2f}'
                    ),
                    "class": (
                        "fog-table-number "
                        "fog-table-money"
                    ),
                },
            ])

        if not product_rows:
            product_rows.append([
                {
                    "content": _("No sales data"),
                    "class": "fog-empty",
                },
                {
                    "content": "—",
                    "class": "fog-empty",
                },
                {
                    "content": "—",
                    "class": "fog-empty",
                },
                {
                    "content": "—",
                    "class": "fog-empty",
                },
            ])

        top_products_table = {
            "headers": [
                str(_("Product")),
                str(_("SKU")),
                str(_("Units")),
                str(_("Revenue")),
            ],
            "rows": product_rows,
        }

        # ==============================================================
        # Inventory
        # ==============================================================

        stock_qs = self._stock_queryset()

        total_stock = (
            stock_qs.aggregate(
                total=Sum("available_units")
            )["total"]
            or 0
        )

        out_of_stock_count = (
            stock_qs
            .filter(
                available_units__lte=0
            )
            .count()
        )

        critical_stock_count = (
            stock_qs
            .filter(
                available_units__gt=0,
                available_units__lte=5,
            )
            .count()
        )

        low_stock_count = (
            stock_qs
            .filter(
                available_units__gt=5,
                available_units__lte=20,
            )
            .count()
        )

        stock_items = (
            stock_qs
            .select_related("product")
            .order_by(
                "available_units",
                "product__name",
            )[:8]
        )

        inventory_rows = []

        for item in stock_items:
            product = item.product

            quantity = (
                item.available_units
                if item.available_units is not None
                else 0
            )

            if quantity <= 0:
                status_label = _("Out of stock")
                status_class = "fog-status-danger"

            elif quantity <= 5:
                status_label = _("Critical")
                status_class = "fog-status-danger"

            elif quantity <= 20:
                status_label = _("Low")
                status_class = "fog-status-warning"

            else:
                status_label = _("Healthy")
                status_class = "fog-status-success"

            inventory_rows.append([
                {
                    "content": (
                        getattr(
                            product,
                            "name",
                            _("Product"),
                        )
                    ),
                    "class": "fog-table-primary",
                },
                {
                    "content": (
                        getattr(
                            product,
                            "sku",
                            "—",
                        )
                        or "—"
                    ),
                    "class": "fog-table-mono",
                },
                {
                    "content": f"{quantity:,}",
                    "class": "fog-table-number",
                },
                {
                    "content": format_html(
                        '<span class="fog-status-wrap {}">'
                        '<span class="fog-status-dot"></span>'
                        '<span>{}</span>'
                        '</span>',
                        status_class,
                        status_label,
                    ),
                    "class": "text-right",
                },
            ])

        if not inventory_rows:
            inventory_rows.append([
                {
                    "content": _("No inventory data"),
                    "class": "fog-empty",
                },
                {
                    "content": "—",
                    "class": "fog-empty",
                },
                {
                    "content": "—",
                    "class": "fog-empty",
                },
                {
                    "content": "—",
                    "class": "fog-empty",
                },
            ])

        inventory_table = {
            "headers": [
                str(_("Product")),
                str(_("SKU")),
                str(_("Available")),
                str(_("Health")),
            ],
            "rows": inventory_rows,
        }

        # ==============================================================
        # Recent orders
        # ==============================================================

        recent_orders = (
            Order.objects
            .select_related(
                "user",
                "payment",
                "shipment",
            )
            .order_by("-created_at")[:10]
        )

        recent_order_rows = []

        for order in recent_orders:
            customer = (
                order.user.get_full_name()
                or order.user.get_username()
            )

            payment = getattr(
                order,
                "payment",
                None,
            )

            shipment = getattr(
                order,
                "shipment",
                None,
            )

            payment_status = (
                payment.get_status_display()
                if payment
                else _("No payment")
            )

            shipment_status = (
                shipment.get_status_display()
                if shipment
                else _("Not created")
            )

            order_status_class = {
                Order.StatusChoices.PAYMENT:
                    "fog-status-info",

                Order.StatusChoices.PENDING:
                    "fog-status-warning",

                Order.StatusChoices.PROCESSING:
                    "fog-status-warning",

                Order.StatusChoices.SHIPPED:
                    "fog-status-primary",

                Order.StatusChoices.DELIVERED:
                    "fog-status-success",

                Order.StatusChoices.CANCELLED:
                    "fog-status-danger",
            }.get(
                order.status,
                "fog-status-neutral",
            )

            created_at = (
                timezone.localtime(
                    order.created_at
                )
                if order.created_at
                else None
            )

            recent_order_rows.append([
                {
                    "content": format_html(
                        '<a href="{}" class="fog-order-id hover:underline">#{}</a>',
                        reverse(
                            "admin:checkout_order_change",
                            args=[order.id],
                        ),
                        order.id,
                    ),
                    "class": "fog-order-id",
                },
                {
                    "content": customer,
                    "class": "fog-table-primary",
                },
                {
                    "content": (
                        f"${order.total_price:,.2f}"
                    ),
                    "class": (
                        "fog-table-number "
                        "fog-table-money"
                    ),
                },
                {
                    "content": format_html(
                        '<span class="fog-status-wrap {}">'
                        '<span class="fog-status-dot"></span>'
                        '<span>{}</span>'
                        '</span>',
                        order_status_class,
                        order.get_status_display(),
                    ),
                    "class": "",
                },
                {
                    "content": payment_status,
                    "class": "fog-table-muted",
                },
                {
                    "content": shipment_status,
                    "class": "fog-table-muted",
                },
                {
                    "content": (
                        created_at.strftime(
                            "%b %d, %H:%M"
                        )
                        if created_at
                        else "—"
                    ),
                    "class": "fog-table-mono",
                },
            ])

        if not recent_order_rows:
            recent_order_rows.append([
                {
                    "content": _("No orders"),
                    "class": "fog-empty",
                },
                {"content": "—", "class": "fog-empty"},
                {"content": "—", "class": "fog-empty"},
                {"content": "—", "class": "fog-empty"},
                {"content": "—", "class": "fog-empty"},
                {"content": "—", "class": "fog-empty"},
                {"content": "—", "class": "fog-empty"},
            ])

        recent_orders_table = {
            "headers": [
                str(_("Order")),
                str(_("Customer")),
                str(_("Total")),
                str(_("Status")),
                str(_("Payment")),
                str(_("Shipment")),
                str(_("Created")),
            ],
            "rows": recent_order_rows,
        }

        # ==============================================================
        # Attention
        # ==============================================================

        attention_items = []

        if failed_payments:
            attention_items.append({
                "title": _("Failed payments"),
                "value": failed_payments,
                "description": _(
                    "Payment records requiring attention"
                ),
                "class": "fog-alert-danger",
                "icon": "error",
            })

        if pending_fulfilment:
            attention_items.append({
                "title": _("Pending fulfilment"),
                "value": pending_fulfilment,
                "description": _(
                    "Paid orders waiting for fulfilment"
                ),
                "class": "fog-alert-warning",
                "icon": "local_shipping",
            })

        if critical_stock_count:
            attention_items.append({
                "title": _("Critical inventory"),
                "value": critical_stock_count,
                "description": _(
                    "Products with 5 or fewer available units"
                ),
                "class": "fog-alert-danger",
                "icon": "inventory_2",
            })

        if refunded_amount > 0:
            attention_items.append({
                "title": _("Refunded volume"),
                "value": (
                    f"${refunded_amount:,.2f}"
                ),
                "description": _(
                    "Refunded payment volume"
                ),
                "class": "fog-alert-neutral",
                "icon": "undo",
            })

        # ==============================================================
        # KPIs
        # ==============================================================

        kpis = [
            {
                "title": _("Revenue"),
                "value": (
                    f"${current_revenue:,.2f}"
                ),
                "description": _(
                    "Completed payments"
                ),
                "delta": self._delta(
                    current_revenue,
                    previous_revenue,
                ),
                "icon": "payments",
            },
            {
                "title": _("Paid orders"),
                "value": (
                    f"{current_paid_orders:,}"
                ),
                "description": _(
                    "Successfully completed purchases"
                ),
                "delta": self._delta(
                    current_paid_orders,
                    previous_paid_orders,
                ),
                "icon": "shopping_bag",
            },
            {
                "title": _("Average order value"),
                "value": (
                    f"${current_aov:,.2f}"
                ),
                "description": _(
                    "Revenue per paid order"
                ),
                "delta": self._delta(
                    current_aov,
                    previous_aov,
                ),
                "icon": "receipt_long",
            },
            {
                "title": _("Active customers"),
                "value": (
                    f"{current_customers:,}"
                ),
                "description": _(
                    "Unique paying customers"
                ),
                "delta": self._delta(
                    current_customers,
                    previous_customers,
                ),
                "icon": "group",
            },
        ]

        # ==============================================================
        # Operational metrics
        # ==============================================================

        operations = [
            {
                "title": _("Paid rate"),
                "value": f"{current_paid_rate:.0f}%",
                "description": _(
                    f"{current_paid_orders:,} of "
                    f"{current_total_orders:,} orders"
                ),
                "icon": "verified",
                "class": "fog-stat-success",
            },
            {
                "title": _("Pending fulfilment"),
                "value": f"{pending_fulfilment:,}",
                "description": _(
                    "Paid orders in pending/processing"
                ),
                "icon": "local_shipping",
                "class": "fog-stat-warning",
            },
            {
                "title": _("Delivery rate"),
                "value": f"{delivered_rate:.0f}%",
                "description": _(
                    f"{delivered_orders:,} delivered"
                ),
                "icon": "done_all",
                "class": "fog-stat-success",
            },
            {
                "title": _("Available inventory"),
                "value": f"{total_stock:,}",
                "description": _(
                    f"{out_of_stock_count:,} out • "
                    f"{critical_stock_count:,} critical"
                ),
                "icon": "inventory_2",
                "class": "fog-stat-primary",
            },
        ]

        # ==============================================================
        # IMPORTANT:
        # Unfold's chart template puts data into a canvas data-value
        # attribute. Pass JSON strings, not Python dictionaries.
        # ==============================================================

        context.update({
            "title": self.title,

            "period": period,
            "period_label": period_label,
            "periods": self.PERIODS,

            "kpis": kpis,
            "operations": operations,

            "attention_items": attention_items,

            "shipment_metrics": {
                "pending": shipment_pending,
                "in_transit": shipment_in_transit,
                "delivered": shipment_delivered,
            },

            "critical_stock_count": (
                critical_stock_count
            ),
            "low_stock_count": (
                low_stock_count
            ),
            "out_of_stock_count": (
                out_of_stock_count
            ),
            "total_stock": total_stock,

            # JSON STRINGS
            "revenue_chart": json.dumps(
                revenue_chart
            ),

            "payment_chart": json.dumps(
                payment_chart
            ),

            "payment_chart_options": json.dumps(
                payment_chart_options
            ),

            "pipeline_chart": json.dumps(
                pipeline_chart
            ),

            "pipeline_chart_options": json.dumps(
                pipeline_chart_options
            ),

            "top_products_table": (
                top_products_table
            ),

            "inventory_table": (
                inventory_table
            ),

            "recent_orders_table": (
                recent_orders_table
            ),

            "orders_url": reverse(
                "admin:checkout_order_changelist"
            ),

            "payments_url": reverse(
                "admin:checkout_orderpayment_changelist"
            ),

            "inventory_url": reverse(
                "admin:inventory_productstock_changelist"
            ),

            "generated_at": timezone.localtime(),
        })

        return context