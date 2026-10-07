def build_logging(*, debug: bool, level: str = "INFO", log_file: str = "") -> dict:
    handlers = {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "dev" if debug else "json",
            "filters": ["context", "sensitive"],
        },
    }
    if log_file:
        handlers["file"] = {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": log_file,
            "maxBytes": 15 * 1024 * 1024,
            "backupCount": 5,
            "encoding": "utf-8",
            "formatter": "json",
            "filters": ["context", "sensitive"],
        }

    return {
        "version": 1,
        "disable_existing_loggers": False,
        "filters": {
            "context": {"()": "core.logging.filters.ContextFilter"},
            "sensitive": {"()": "core.logging.filters.SensitiveDataFilter"},
        },
        "formatters": {
            "dev": {
                "format": "{asctime} {levelname:<7} {request_id} {name}: {message}",
                "style": "{",
                "datefmt": "%H:%M:%S",
            },
            "json": {
                "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
                "format": "%(asctime)s %(levelname)s %(name)s %(request_id)s %(message)s",
            },
        },
        "handlers": handlers,
        "root": {"handlers": list(handlers), "level": level},
        "loggers": {
            "fog": {"level": level},
            "celery": {"level": level},
            "django": {"level": "INFO"},
            "django.db.backends": {"level": "INFO"},  # no SQL spam at DEBUG
            "urllib3": {"level": "WARNING"},
        },
    }