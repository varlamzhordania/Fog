_REGISTRY = {}
FALLBACK_CODE = "manual"


def register(provider_cls):
    _REGISTRY[provider_cls.code] = provider_cls()
    return provider_cls


def get_provider(code):
    return _REGISTRY.get(code) or _REGISTRY[FALLBACK_CODE]