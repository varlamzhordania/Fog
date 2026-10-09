from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from drf_spectacular.utils import extend_schema, OpenApiResponse
from constance import config

from .serializers import (
    ConstanceConfigSerializer,
    ContactSerializer,
)


@extend_schema(tags=["Settings"])
class ConstanceSettingsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        serializer = ConstanceConfigSerializer(
            instance=config,
            allowed_keys=set(settings.CONSTANCE_PUBLIC_KEYS),
            context={"request": request},
        )
        return Response(serializer.data)


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