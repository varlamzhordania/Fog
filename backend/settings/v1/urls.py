from django.urls import path

from .views import (
    ContactCreateView,
    ConstanceSettingsView,
)


app_name = 'settings-v1'

urlpatterns = [
    path('', ConstanceSettingsView.as_view(), name='constance'),
    path(
        'contact/',
        ContactCreateView.as_view(),
        name='contact',
    ),
]