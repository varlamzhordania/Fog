from .celery import app as celery_app

__all__ = ('celery_app',)


# Compatibility patch: social-auth-core >= 4.3.0 dropped GooglePlusAuth,
# but drf-social-oauth2 still imports it at the module level.
try:
    import social_core.backends.google
    from social_core.backends.google import GoogleOAuth2

    if not hasattr(social_core.backends.google, "GooglePlusAuth"):
        social_core.backends.google.GooglePlusAuth = GoogleOAuth2
except ImportError:
    pass