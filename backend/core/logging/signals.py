from celery.signals import task_postrun, task_prerun

from .context import bind, clear


@task_prerun.connect
def _bind_task(task_id=None, task=None, **kwargs):
    clear()
    bind(task_id=task_id, task=task.name)


@task_postrun.connect
def _clear_task(**kwargs):
    clear()