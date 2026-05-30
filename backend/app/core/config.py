import os
from pathlib import Path

# backend/
BASE_DIR = Path(__file__).parent.parent.parent

FRONTEND_DIR = BASE_DIR.parent / "frontend"

# Where chat.db lives. Override via DATA_DIR env var (e.g. a Docker volume).
DATA_DIR = Path(os.getenv("DATA_DIR", str(BASE_DIR)))

MAX_HISTORY = 50
PING_INTERVAL = 300
