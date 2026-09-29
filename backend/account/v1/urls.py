from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import (
    UserView,
    AddressViewSet,
    PasswordResetRequestView,
    PasswordResetConfirmView, UserRegisterView,
)

app_name = 'account-v1'

router = SimpleRouter()

router.register('address', AddressViewSet, basename='address')

urlpatterns = [
    path('', UserView.as_view(), name='user'),
    path(
        "register/",
        UserRegisterView.as_view(),
        name="register",
    ),
    path(
        'password-reset/',
        PasswordResetRequestView.as_view(),
        name='password_reset_request'
    ),
    path(
        'password-reset-confirm/',
        PasswordResetConfirmView.as_view(),
        name='password_reset_confirm'
    ),
]

urlpatterns += router.urls
