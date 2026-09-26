from typing import Set
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework import status, permissions
from constance import config
from drf_spectacular.utils import extend_schema

from .serializers import ConstanceConfigSerializer

@extend_schema(tags=["Settings"])
class ConstanceSettingsView(APIView):
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    serializer_class = ConstanceConfigSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

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
        is_staff = bool(request.user and request.user.is_authenticated and request.user.is_staff)
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
        return Response(response_serializer.data, status=status.HTTP_200_OK)