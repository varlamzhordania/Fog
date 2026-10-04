from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from unfold.admin import ModelAdmin
from unfold.decorators import display
from unfold.widgets import UnfoldAdminSelectWidget, UnfoldAdminTextInputWidget

from django_celery_beat.models import (
    ClockedSchedule,
    CrontabSchedule,
    IntervalSchedule,
    PeriodicTask,
    SolarSchedule,
)
from django_celery_beat.admin import ClockedScheduleAdmin as BaseClockedScheduleAdmin
from django_celery_beat.admin import CrontabScheduleAdmin as BaseCrontabScheduleAdmin
from django_celery_beat.admin import PeriodicTaskAdmin as BasePeriodicTaskAdmin
from django_celery_beat.admin import PeriodicTaskForm, TaskSelectWidget


from .models import Contact


@admin.register(Contact)
class ContactAdmin(ModelAdmin):
    list_display = (
        'name',
        'email',
        'subject',
        'response_status',
        'is_active',
        'responded_at',
        'created_at',
    )
    list_filter = (
        'has_responded',
        'is_active',
        'created_at',
    )
    search_fields = (
        'name',
        'email',
        'subject',
        'message',
    )
    readonly_fields = (
        'created_at',
        'updated_at',
        'responded_at',
    )
    fieldsets = (
        (
            _('Contact Information'),
            {
                'fields': (
                    'name',
                    'email',
                    'subject',
                ),
            },
        ),
        (
            _('Message'),
            {
                'fields': (
                    'message',
                ),
            },
        ),
        (
            _('Response'),
            {
                'fields': (
                    'has_responded',
                    'responded_at',
                ),
            },
        ),
        (
            _('System Information'),
            {
                'fields': (
                    'is_active',
                    'created_at',
                    'updated_at',
                ),
                'classes': ('collapse',),
            },
        ),
    )
    actions = (
        'mark_as_responded',
    )
    ordering = (
        'has_responded',
        '-created_at',
    )

    @display(
        description=_('Status'),
        label={
            "responded": "success",
            "attention": "danger",
        },
    )
    def response_status(self, obj):
        if obj.has_responded:
            return "responded", _("Responded")

        return "attention", _("Need Attention")

    @admin.action(
        description=_('Mark selected contacts as responded'),
    )
    def mark_as_responded(self, request, queryset):
        for contact in queryset:
            contact.mark_as_responded()

        self.message_user(
            request,
            _('Selected contacts have been marked as responded.'),
        )


admin.site.unregister(PeriodicTask)
admin.site.unregister(IntervalSchedule)
admin.site.unregister(CrontabSchedule)
admin.site.unregister(SolarSchedule)
admin.site.unregister(ClockedSchedule)


class UnfoldTaskSelectWidget(UnfoldAdminSelectWidget, TaskSelectWidget):
    pass


class UnfoldPeriodicTaskForm(PeriodicTaskForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["task"].widget = UnfoldAdminTextInputWidget()
        self.fields["regtask"].widget = UnfoldTaskSelectWidget()


@admin.register(PeriodicTask)
class PeriodicTaskAdmin(BasePeriodicTaskAdmin, ModelAdmin):
    form = UnfoldPeriodicTaskForm


@admin.register(IntervalSchedule)
class IntervalScheduleAdmin(ModelAdmin):
    pass


@admin.register(CrontabSchedule)
class CrontabScheduleAdmin(BaseCrontabScheduleAdmin, ModelAdmin):
    pass


@admin.register(SolarSchedule)
class SolarScheduleAdmin(ModelAdmin):
    pass


@admin.register(ClockedSchedule)
class ClockedScheduleAdmin(BaseClockedScheduleAdmin, ModelAdmin):
    pass