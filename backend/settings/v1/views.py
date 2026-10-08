from typing import Set
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser, SAFE_METHODS
from drf_spectacular.utils import extend_schema, OpenApiResponse
from constance import config

from .serializers import (
    ConstanceConfigSerializer,
    ContactSerializer,
)


@extend_schema(tags=["Settings"])
class ConstanceSettingsView(APIView):
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    serializer_class = ConstanceConfigSerializer

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [AllowAny()]
        return [IsAdminUser()]

    def _get_public_keys(self) -> Set[str]:
        return getattr(
            settings,
            "CONSTANCE_PUBLIC_KEYS",
            {
                "SITE_NAME",
                "SITE_LOGO",
                "SUPPORT_EMAIL",
                "CURRENCY",
                "MINIMUM_ORDER_AMOUNT",
                "MAINTENANCE_MODE",
            },
        )

    def _get_target_keys(self, is_staff: bool) -> Set[str]:
        all_keys = set(getattr(settings, "CONSTANCE_CONFIG", {}).keys())
        if is_staff:
            return all_keys
        return all_keys.intersection(self._get_public_keys())

    def get(self, request, *args, **kwargs):
        is_staff = bool(
            request.user and request.user.is_authenticated and request.user.is_staff
        )
        target_keys = self._get_target_keys(is_staff=is_staff)

        serializer = ConstanceConfigSerializer(
            instance=config,
            allowed_keys=target_keys,
            context={"request": request},
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, *args, **kwargs):
        serializer = ConstanceConfigSerializer(
            instance=config,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        response_serializer = ConstanceConfigSerializer(
            instance=config,
            context={"request": request},
        )
        return Response(
            response_serializer.data,
            status=status.HTTP_200_OK
        )


@extend_schema(
    tags=["Settings"],
    request=ContactSerializer,
    responses={
        201: ContactSerializer,
        400: OpenApiResponse(
            description="Invalid contact information."
        ),
    },
    summary="Submit a contact message",
    description="Create a new contact message from the website contact form.",
)
class ContactCreateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = ContactSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        contact = serializer.save()

        return Response(
            ContactSerializer(contact).data,
            status=status.HTTP_201_CREATED,
        )