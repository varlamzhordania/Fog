import json
from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from django_celery_beat.models import (
    CrontabSchedule,
    IntervalSchedule,
    PeriodicTask,
    PeriodicTasks,
)
from celery.schedules import crontab


class Command(BaseCommand):
    help = "Syncs static CELERY_BEAT_SCHEDULE from Django settings into the django-celery-beat database models."

    def add_arguments(self, parser):
        parser.add_argument(
            "--prune",
            action="store_true",
            help="Remove periodic tasks in database that are no longer defined in CELERY_BEAT_SCHEDULE.",
        )
        parser.add_argument(
            "--disable-missing",
            action="store_true",
            help="Disable periodic tasks in database that are no longer defined in CELERY_BEAT_SCHEDULE instead of deleting them.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        schedule_dict = getattr(settings, "CELERY_BEAT_SCHEDULE", {})
        task_routes = getattr(settings, "CELERY_TASK_ROUTES", {})

        if not schedule_dict:
            self.stdout.write(
                self.style.WARNING("No CELERY_BEAT_SCHEDULE found in settings.")
            )
            return

        synced_task_names = set()

        for name, task_conf in schedule_dict.items():
            task_path = task_conf.get("task")
            schedule_spec = task_conf.get("schedule")
            raw_args = task_conf.get("args", [])
            raw_kwargs = task_conf.get("kwargs", {})

            # Determine routing queue (explicit in task_conf, or lookup from CELERY_TASK_ROUTES)
            queue = task_conf.get("queue")
            if not queue and task_path in task_routes:
                route = task_routes[task_path]
                if isinstance(route, dict):
                    queue = route.get("queue")
                elif isinstance(route, str):
                    queue = route

            interval_model = None
            crontab_model = None

            # Handle Integer / Float (seconds)
            if isinstance(schedule_spec, (int, float)):
                interval_model, _ = IntervalSchedule.objects.get_or_create(
                    every=int(schedule_spec),
                    period=IntervalSchedule.SECONDS,
                )

            # Handle datetime.timedelta
            elif isinstance(schedule_spec, timedelta):
                total_seconds = int(schedule_spec.total_seconds())
                if total_seconds % 86400 == 0:
                    interval_model, _ = IntervalSchedule.objects.get_or_create(
                        every=total_seconds // 86400,
                        period=IntervalSchedule.DAYS,
                    )
                elif total_seconds % 3600 == 0:
                    interval_model, _ = IntervalSchedule.objects.get_or_create(
                        every=total_seconds // 3600,
                        period=IntervalSchedule.HOURS,
                    )
                elif total_seconds % 60 == 0:
                    interval_model, _ = IntervalSchedule.objects.get_or_create(
                        every=total_seconds // 60,
                        period=IntervalSchedule.MINUTES,
                    )
                else:
                    interval_model, _ = IntervalSchedule.objects.get_or_create(
                        every=total_seconds,
                        period=IntervalSchedule.SECONDS,
                    )

            # Handle Celery Crontab
            elif isinstance(schedule_spec, crontab):
                crontab_model, _ = CrontabSchedule.objects.get_or_create(
                    minute=self._cron_element_to_str(schedule_spec._orig_minute),
                    hour=self._cron_element_to_str(schedule_spec._orig_hour),
                    day_of_week=self._cron_element_to_str(schedule_spec._orig_day_of_week),
                    day_of_month=self._cron_element_to_str(schedule_spec._orig_day_of_month),
                    month_of_year=self._cron_element_to_str(schedule_spec._orig_month_of_year),
                    timezone=str(settings.TIME_ZONE),
                )
            else:
                self.stdout.write(
                    self.style.ERROR(
                        f"Unsupported schedule type for task '{name}': {type(schedule_spec)}"
                    )
                )
                continue

            # Upsert PeriodicTask
            task_defaults = {
                "task": task_path,
                "interval": interval_model,
                "crontab": crontab_model,
                "args": json.dumps(raw_args),
                "kwargs": json.dumps(raw_kwargs),
                "queue": queue,
                "enabled": task_conf.get("enabled", True),
                "description": f"Synced from settings.py: {name}",
            }

            task_obj, created = PeriodicTask.objects.update_or_create(
                name=name,
                defaults=task_defaults,
            )

            synced_task_names.add(name)
            status_verb = "Created" if created else "Updated"
            self.stdout.write(
                self.style.SUCCESS(f"{status_verb} task '{name}' ({task_path})")
            )

        # Handle pruning or disabling tasks removed from settings
        if options["prune"]:
            deleted_count, _ = PeriodicTask.objects.exclude(name__in=synced_task_names).delete()
            if deleted_count:
                self.stdout.write(self.style.WARNING(f"Pruned {deleted_count} stale tasks."))
        elif options["disable_missing"]:
            updated_count = PeriodicTask.objects.exclude(name__in=synced_task_names).update(enabled=False)
            if updated_count:
                self.stdout.write(self.style.WARNING(f"Disabled {updated_count} missing tasks."))

        # Signal celery beat scheduler cache to refresh
        PeriodicTasks.update_changed()
        self.stdout.write(self.style.SUCCESS("Celery beat database schedule successfully synced."))

    @staticmethod
    def _cron_element_to_str(val):
        """Normalize celery crontab internal representations (*, int, set, etc.) to cron string."""
        if val is None or val == "*":
            return "*"
        if isinstance(val, (set, list, tuple)):
            if len(val) == 1:
                return str(list(val)[0])
            return ",".join(str(item) for item in sorted(val))
        return str(val)