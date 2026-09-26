from typing import Any, Dict, Optional, Set
from django import forms
from django.conf import settings
from django.core.files.base import File
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import UploadedFile
from rest_framework import serializers
from constance import config


class ConstanceImageField(serializers.Field):
    """
    Serializes Constance image/file values into fully qualified absolute URLs.
    Handles:
    - Storage-relative paths (e.g., 'constance/logo.png' -> '/media/constance/logo.png')
    - Explicit media paths (e.g., '/media/logo.png')
    - Static paths (e.g., '/static/imgs/logo_black.png')
    - External absolute URLs (e.g., 'https://...')
    - Multipart file uploads on write (saving via default_storage)
    """

    def to_representation(self, value: Any) -> Optional[str]:
        if not value:
            return None

        # 1. Check if the value has a direct .url attribute (e.g. FieldFile)
        raw_url = getattr(value, "url", None)
        if not raw_url:
            raw_url = str(value).strip()

        if not raw_url:
            return None

        # 2. Return as-is if already an absolute HTTP/HTTPS URL
        if raw_url.startswith(("http://", "https://", "//")):
            return raw_url

        media_url = getattr(settings, "MEDIA_URL", "/media/")
        static_url = getattr(settings, "STATIC_URL", "/static/")

        # 3. Resolve relative paths
        if raw_url.startswith(static_url) or raw_url.startswith(
                "/static/"
                ):
            url = "/" + raw_url.lstrip("/")
        elif raw_url.startswith(media_url) or raw_url.startswith(
                "/media/"
                ):
            url = "/" + raw_url.lstrip("/")
        elif raw_url.startswith("media/"):
            url = f"/{raw_url}"
        elif raw_url.startswith("static/"):
            url = f"/{raw_url}"
        else:
            # Storage path saved by Constance (e.g., 'constance/logo.png' or 'logo.png')
            try:
                url = default_storage.url(raw_url)
            except Exception:
                clean_media = media_url.rstrip("/")
                clean_path = raw_url.lstrip("/")
                url = f"{clean_media}/{clean_path}"

        # If default_storage.url returned a cloud-hosted absolute URL (e.g. S3)
        if url.startswith(("http://", "https://", "//")):
            return url

        if not url.startswith("/"):
            url = f"/{url}"

        # 4. Resolve absolute URI using active request
        request = self.context.get("request") if self.context else None
        if request is not None:
            return request.build_absolute_uri(url)

        # 5. Fallback for CLI/worker contexts
        base_url = (
                getattr(settings, "BACKEND_URL", None)
                or getattr(settings, "SITE_URL", None)
                or ""
        ).rstrip("/")
        if base_url:
            return f"{base_url}{url}"

        return url

    def to_internal_value(self, data: Any) -> str:
        if not data:
            return ""

        # Handle binary file uploads on PATCH
        if isinstance(data, (UploadedFile, File)):
            file_root = getattr(
                settings,
                "CONSTANCE_FILE_ROOT",
                "constance"
                ).strip("/")
            file_name = default_storage.get_valid_name(data.name)
            target_path = f"{file_root}/{file_name}" if file_root else file_name
            saved_name = default_storage.save(target_path, data)
            return saved_name

        # Handle path strings
        str_val = str(data).strip()
        media_url = getattr(settings, "MEDIA_URL", "/media/").strip("/")

        # Normalize and strip redundant media prefixes for clean storage paths
        if str_val.startswith(f"/{media_url}/"):
            str_val = str_val[len(f"/{media_url}/"):]
        elif str_val.startswith(f"{media_url}/"):
            str_val = str_val[len(f"{media_url}/"):]

        return str_val


TYPE_MAPPING = {
    str: serializers.CharField,
    int: serializers.IntegerField,
    float: serializers.FloatField,
    bool: serializers.BooleanField,
    "image_field": ConstanceImageField,
    "file_field": ConstanceImageField,
    forms.ImageField: ConstanceImageField,
    forms.FileField: ConstanceImageField,
}


def resolve_serializer_field(val_type: Any) -> type:
    if val_type in ("image_field", "file_field", "image", "file"):
        return ConstanceImageField
    if isinstance(val_type, type) and issubclass(
            val_type,
            (forms.FileField, forms.ImageField)
            ):
        return ConstanceImageField
    return TYPE_MAPPING.get(val_type, serializers.CharField)


class ConstanceConfigSerializer(serializers.Serializer):
    def __init__(
            self,
            *args,
            allowed_keys: Optional[Set[str]] = None,
            **kwargs,
    ):
        super().__init__(*args, **kwargs)
        constance_config: Dict[str, Any] = getattr(
            settings,
            "CONSTANCE_CONFIG",
            {}
            )

        for key, item in constance_config.items():
            if allowed_keys is not None and key not in allowed_keys:
                continue

            default_val = item[0]
            help_text = item[1] if len(item) > 1 else ""
            val_type = item[2] if len(item) > 2 else type(default_val)

            field_class = resolve_serializer_field(val_type)
            self.fields[key] = field_class(
                required=False,
                allow_null=True if val_type not in (
                bool, int, float) else False,
                help_text=help_text,
            )

    def create(self, validated_data: dict):
        return self.update(config, validated_data)

    def update(self, instance, validated_data: dict):
        for key, value in validated_data.items():
            if hasattr(config, key):
                setattr(config, key, value)
        return config