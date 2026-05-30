from pathlib import Path

# backend/
BASE_DIR = Path(__file__).parent.parent.parent

FRONTEND_DIR = BASE_DIR.parent / "frontend"

MAX_HISTORY = 50
PING_INTERVAL = 300
