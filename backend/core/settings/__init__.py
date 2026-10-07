import os

_env = os.environ.get("DJANGO_ENV", "prod")

if _env == "local":
    from .local import * 
elif _env == "prod":
    from .prod import *
else:
    raise ImportError(f"DJANGO_ENV must be 'local' or 'prod', got {_env!r}")