import logging
import sys

def configure_logging():
    """
    Configure a simple, clear logging format to stdout.
    Call this early in app startup (main.py).
    """
    root = logging.getLogger()
    if root.handlers:
        # don't reconfigure if already configured
        return
    handler = logging.StreamHandler(sys.stdout)
    fmt = "%(asctime)s %(levelname)s %(name)s %(message)s"
    formatter = logging.Formatter(fmt)
    handler.setFormatter(formatter)
    root.addHandler(handler)
    root.setLevel(logging.INFO)

# optional helper to get module logger
def get_logger(name: str):
    configure_logging()
    return logging.getLogger(name)
