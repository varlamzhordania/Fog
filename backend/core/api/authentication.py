from oauth2_provider.contrib.rest_framework import OAuth2Authentication

from core.logging.context import bind


class LoggedOAuth2Authentication(OAuth2Authentication):
    def authenticate(self, request):
        result = super().authenticate(request)
        if result:
            bind(user_id=result[0].pk)
        return result