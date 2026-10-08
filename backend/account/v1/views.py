from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.viewsets import ModelViewSet
from django.db import transaction

from core.api.mixins import OptionalPaginationMixin
from core.logging import get_logger
from core.logging.audit import audit
from account.models import Address, User
from account.services.addresses import AddressService
from account.tasks import send_password_reset_email_task

from .serializers import (
    UserSerializer,
    UserSettingsSerializer,
    ListAddressSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer, UserRegisterSerializer,
)



log = get_logger(__name__)
_RESET_SENT = {"message": "If an account with that email exists, a password reset link has been sent."}

@extend_schema(tags=["Account"])
class UserView(RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        request = self.request

        if request.method == "GET":
            return UserSerializer
        elif request.method == "PUT":
            return UserSettingsSerializer
        elif request.method == "PATCH":
            return UserSettingsSerializer
        else:
            return UserSerializer


@extend_schema(
    tags=["Account"],
    request=UserRegisterSerializer,
    responses={
        201: UserSerializer,
        400: OpenApiResponse(
            description="Invalid registration data."
        ),
    },
    summary="Register a new user",
    description="Create a new user account using an email address and password.",
)
class UserRegisterView(APIView):
    permission_classes = [AllowAny]
    serializer_class = UserRegisterSerializer

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(
            data=request.data,
            context={"request": request},
        )

        serializer.is_valid(raise_exception=True)

        user = serializer.save()

        return Response(
            UserSerializer(
                user,
                context={"request": request},
            ).data,
            status=status.HTTP_201_CREATED,
        )


@extend_schema(tags=["Account"])
class AddressViewSet(OptionalPaginationMixin, ModelViewSet):
    serializer_class = ListAddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user, is_active=True)

    def perform_create(self, serializer):
        AddressService.create(self.request.user, serializer)

    def perform_update(self, serializer):
        AddressService.update(serializer)

    def perform_destroy(self, instance):
        AddressService.remove(instance)


@extend_schema(
    tags=["Account"],
    request=PasswordResetRequestSerializer,
    responses={
        200: OpenApiResponse(
            description="Password reset link sent to your email."
        ),
        400: OpenApiResponse(
            description="Invalid email or malformed request."
        ),
    },
    summary="Request password reset",
    description="Send a password reset link to the user's email if the address is valid and exists in the system."
)
class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.filter(
            email__iexact=serializer.validated_data["email"], is_active=True
        ).first()
        if user:
            send_password_reset_email_task.delay(user.id)
        else:
            log.info("account.password_reset.unknown_email")
        return Response(_RESET_SENT)


@extend_schema(
    tags=["Account"],
    request=PasswordResetConfirmSerializer,
    responses={
        200: OpenApiResponse(
            description="Password has been reset successfully."
        ),
        400: OpenApiResponse(
            description="Invalid token, user ID, or password data."
        ),
    },
    summary="Confirm password reset",
    description="Confirms a password reset using the provided UID, token, and new password. Typically used after clicking the reset link from the email."
)
class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        audit("account.password_reset", user_id=user.pk)
        return Response({"message": "Password has been reset successfully."})
