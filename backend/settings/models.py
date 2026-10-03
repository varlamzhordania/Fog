from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from core.models import BaseModel


class Contact(BaseModel):
    name = models.CharField(
        verbose_name=_('Name'),
        max_length=255,
        help_text=_('Name of the person who filled out the form.'),
    )
    email = models.EmailField(
        verbose_name=_('Email'),
        max_length=255,
        help_text=_(
            'Email address of the person who filled out the form.'
            ),
    )
    subject = models.CharField(
        verbose_name=_('Subject'),
        max_length=255,
    )
    message = models.TextField(
        verbose_name=_('Message'),
    )
    has_responded = models.BooleanField(
        verbose_name=_('Has responded'),
        default=False,
    )
    responded_at = models.DateTimeField(
        verbose_name=_('Responded at'),
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = _('Contact')
        verbose_name_plural = _('Contacts')
        ordering = ('-created_at',)

    def __str__(self):
        return self.name

    def mark_as_responded(self):
        if not self.has_responded:
            self.has_responded = True
            self.responded_at = timezone.now()
            self.save(update_fields=('has_responded', 'responded_at'))
