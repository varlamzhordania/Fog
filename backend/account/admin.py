from unfold import admin
from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm
from django.contrib import admin as django_admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.admin import GroupAdmin as BaseGroupAdmin
from django.contrib.auth.models import Group

from .forms import CustomUserCreationForm, CustomUserChangeForm
from .models import User, Address

django_admin.site.unregister(Group)

@django_admin.register(Group)
class GroupAdmin(BaseGroupAdmin, admin.ModelAdmin):
    pass


class AddressInline(admin.StackedInline):
    model = Address
    fieldsets = [
        ('Contact', {
            'fields': [
                'full_name',
            ],
        }),
        ('Address', {
            'fields': [
                'line1',
                'line2',
                'country',
                'state',
                'city',
                'postal_code',
            ]
        }),
        ('Meta', {
            'fields': [
                'is_default',
                'is_active',
                'created_at',
                'updated_at',
            ]
        })
    ]
    readonly_fields = ['created_at', 'updated_at']
    extra = 0

@django_admin.register(User)
class CustomUserAdmin(admin.ModelAdmin, BaseUserAdmin):
    form = UserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm
    model = User
    list_display = (
        "id", "email", "is_staff", "is_superuser", "is_active",
        "date_joined",
        "last_login")
    list_filter = ("is_staff", "is_active", "groups")
    readonly_fields = ("email", "date_joined", "last_login", "last_ip")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal Information",
         {"fields": ("first_name", "last_name",)}),
        ("Permissions",
         {"fields": ("is_staff", "is_superuser", "is_active", "groups",
                     "user_permissions")}),
        ("Security", {"fields": ("date_joined", "last_login", "last_ip")}),
    )
    add_fieldsets = (
        (None, {
            "fields": (
                "email", "password1", "password2", "first_name",
                "last_name",
                "groups", "is_staff", "is_active",
            )}
         ),
    )
    search_fields = ("id", "email",)
    ordering = ("id",)
    inlines = (AddressInline,)


