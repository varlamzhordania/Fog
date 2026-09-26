from django.urls import path
from .views import ConstanceSettingsView


app_name = 'settings-v1'

urlpatterns = [
    path('', ConstanceSettingsView.as_view(), name='constance'),
]