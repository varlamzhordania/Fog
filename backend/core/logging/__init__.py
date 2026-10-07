import logging

def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name if name.startswith("fog.") else f"fog.{name}")