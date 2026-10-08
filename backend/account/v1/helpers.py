from django.conf import settings
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from account.models import User
from core.branding import APP_NAME, logo_url, support_email


def send_password_reset_email(instance: User):
    token = PasswordResetTokenGenerator().make_token(instance)
    uid = urlsafe_base64_encode(force_bytes(instance.pk))
    reset_link = f"{settings.FRONTEND_URL}/password-reset/confirm/?uid={uid}&token={token}"

    html = render_to_string("emails/password_reset.html", {
        "user": instance,
        "reset_link": reset_link,
        "app_name": APP_NAME,
        "support_email": support_email(),
        "logo_url": logo_url(),
        "valid_hours": settings.PASSWORD_RESET_TIMEOUT // 3600,
    })
    email = EmailMultiAlternatives(
        subject="Password Reset Request",
        body=f"Click the link to reset your password: {reset_link}",
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[instance.email],
    )
    email.attach_alternative(html, "text/html")
    email.send()