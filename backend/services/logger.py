import os
from datetime import datetime

ENABLE_LOGGING = os.getenv("ENABLE_LOGGING", "true").lower() == "true"

class Logger:
    @staticmethod
    def info(msg: str):
        if ENABLE_LOGGING:
            print(f"[\033[96mINFO\033[0m] {datetime.now().strftime('%H:%M:%S')} - {msg}")

    @staticmethod
    def error(msg: str, err: str = ""):
        if ENABLE_LOGGING:
            print(f"[\033[91mERROR\033[0m] {msg} {err}")

    # ADD THIS METHOD
    @staticmethod
    def debug(msg: str):
        if ENABLE_LOGGING:
            print(f"[\033[92mDEBUG\033[0m] {msg}")