from django import forms
from django.utils.translation import gettext_lazy as _
from unfold.forms import (
    UserChangeForm as UnfoldUserChangeForm,
    UserCreationForm as UnfoldUserCreationForm,
)
from .models import User

class CustomUserCreationForm(UnfoldUserCreationForm):
    email = forms.EmailField(
        label=_("Email address"),
        required=True,
    )

    class Meta:
        model = User
        fields = "__all__"




class CustomUserChangeForm(UnfoldUserChangeForm):
    class Meta:
        model = User
        fields = "__all__"