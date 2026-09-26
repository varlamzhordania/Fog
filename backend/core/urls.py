from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
# from django.conf.urls.i18n import i18n_patterns # Wrap whole urls patterns to add translation to all urls
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)


from .views import set_language

urlpatterns = [
    path('api/v1/account/', include('account.v1.urls', namespace='account-v1')),
    path('api/v1/settings/', include('settings.v1.urls', namespace='settings-v1')),
    path('admin/', admin.site.urls),

]

urlpatterns += [
    path("setlang/", set_language, name="set_language"),
    path('api-auth/', include('rest_framework.urls')),
    path('auth/', include('drf_social_oauth2.urls', namespace='drf')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path(
        'api/schema/docs/',
        SpectacularSwaggerView.as_view(url_name='schema'),
        name='swagger-ui'
    ),
    # re_path(r'^rosetta/', include('rosetta.urls')),
    # path('hijack/', include('hijack.urls')),
    path("ckeditor5/", include('django_ckeditor_5.urls')),
    path("_nested_admin/", include("nested_admin.urls")),
]

urlpatterns += static(
    settings.MEDIA_URL,
    document_root=settings.MEDIA_ROOT
    )
urlpatterns += static(
    settings.STATIC_URL,
    document_root=settings.STATIC_ROOT
    )
