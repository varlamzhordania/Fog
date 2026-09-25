from django.contrib import admin as django_admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import GroupAdmin as BaseGroupAdmin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group
from django.urls import NoReverseMatch, reverse
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from unfold import admin
from unfold.forms import AdminPasswordChangeForm

from .models import Address
from .forms import CustomUserChangeForm, CustomUserCreationForm

User = get_user_model()


class AddressInline(admin.StackedInline):
    model = Address
    extra = 0
    fields = [
        ("full_name", "is_default"),
        ("line1", "line2"),
        ("city", "state", "postal_code"),
        "country",
    ]


@django_admin.register(User)
class UserAdmin(BaseUserAdmin, admin.ModelAdmin):
    form = CustomUserChangeForm
    add_form = CustomUserCreationForm
    change_password_form = AdminPasswordChangeForm

    inlines = [AddressInline]

    list_display = [
        "email",
        "full_name_display",
        "is_staff",
        "is_active",
        "orders_count",
        "last_ip",
        "date_joined",
    ]
    list_filter = ["is_staff", "is_superuser", "is_active", "groups"]
    search_fields = ["email", "first_name", "last_name", "last_ip"]
    ordering = ["-date_joined"]
    readonly_fields = ["email", "last_ip", "last_login", "date_joined"]

    fieldsets = (
        (
            _("Account Credentials"),
            {
                "fields": ("email", "password"),
            },
        ),
        (
            _("Personal Information"),
            {
                "fields": (
                    ("first_name", "last_name"),
                ),
            },
        ),
        (
            _("Network & Security"),
            {
                "fields": ("last_ip",),
            },
        ),
        (
            _("Permissions & Access"),
            {
                "fields": (
                    ("is_active", "is_staff", "is_superuser"),
                    "groups",
                    "user_permissions",
                ),
            },
        ),
        (
            _("Important Dates"),
            {
                "fields": (("last_login", "date_joined"),),
            },
        ),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ["wide"],
                "fields": (
                    "email",
                    "first_name",
                    "last_name",
                    "password1",
                    "password2",
                ),
            },
        ),
    )

    @django_admin.display(description=_("Full Name"))
    def full_name_display(self, obj):
        name = obj.get_full_name().strip()
        return name if name else "—"

    @django_admin.display(description=_("Orders"))
    def orders_count(self, obj):
        count = obj.orders.count()
        if count == 0:
            return format_html(
                '<span class="text-xs text-gray-400 text-center">{}</span>', 0
            )
        try:
            url = reverse(
                "admin:checkout_order_changelist"
            ) + f"?user__id__exact={obj.id}"
            return format_html(
                '<a href="{}" class="font-semibold text-primary-600 underline">{} order(s)</a>',
                url,
                count,
            )
        except NoReverseMatch:
            return str(count)

    def has_add_permission(self, request):
        return False


@django_admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = [
        "full_name",
        "user_link",
        "address_summary",
        "country",
        "is_default_badge",
        "created_at",
    ]
    list_filter = ["is_default", "country", "created_at"]
    search_fields = [
        "full_name",
        "line1",
        "city",
        "state",
        "postal_code",
        "country",
        "user__email",
    ]
    readonly_fields = ["id", "created_at", "updated_at"]
    ordering = ["-is_default", "-updated_at"]

    fieldsets = [
        (
            _("Recipient & User"),
            {
                "fields": (
                    "user",
                    "full_name",
                    "is_default",
                )
            },
        ),
        (
            _("Address Details"),
            {
                "fields": (
                    "line1",
                    "line2",
                    ("city", "state", "postal_code"),
                    "country",
                )
            },
        ),
        (
            _("Timestamps"),
            {
                "fields": (("created_at", "updated_at"),),
            },
        ),
    ]

    @django_admin.display(description=_("User"))
    def user_link(self, obj):
        if not obj.user:
            return "—"
        try:
            url = reverse("admin:account_user_change", args=[obj.user.id])
            return format_html(
                '<a href="{}" class="font-semibold text-primary-600 underline">{}</a>',
                url,
                obj.user.email,
            )
        except NoReverseMatch:
            return obj.user.email

    @django_admin.display(description=_("Address"))
    def address_summary(self, obj):
        parts = [obj.line1]
        if obj.line2:
            parts.append(obj.line2)
        parts.append(
            f"{obj.city}, {obj.state or ''} {obj.postal_code}".strip()
        )
        return ", ".join(filter(None, parts))

    @django_admin.display(description=_("Default"))
    def is_default_badge(self, obj):
        if obj.is_default:
            return format_html(
                '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">{}</span>',
                _("Default"),
            )
        return format_html('<span class="text-xs text-gray-400">—</span>')


try:
    django_admin.site.unregister(Group)
except django_admin.sites.NotRegistered:
    pass


@django_admin.register(Group)
class GroupAdmin(BaseGroupAdmin, admin.ModelAdmin):
    list_display = ["name"]
    search_fields = ["name"]
