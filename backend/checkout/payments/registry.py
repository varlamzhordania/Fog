_REGISTRY = {}
FALLBACK_CODE = "manual"


def register(provider_cls):
    instance = provider_cls()
    for code in provider_cls.codes:
        _REGISTRY[code] = instance
    return provider_cls


def get_provider(code):
    """Unknown codes fall back to the manual provider."""
    return _REGISTRY.get(code) or _REGISTRY[FALLBACK_CODE]