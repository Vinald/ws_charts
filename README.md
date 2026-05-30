# WebSocket Chat Application

A real-time, multi-room WebSocket chat application with reliability, security, and UX features. Built with FastAPI and vanilla JavaScript.

## Project Structure

```
ws_charts/
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── frontend/
│   ├── index.html        # Main HTML
│   ├── styles.css        # WhatsApp-style dark theme
│   └── script.js         # WebSocket client (auto-reconnect, typing, ticks)
│
└── backend/
    ├── requirements.txt
    ├── alembic.ini           # Alembic configuration
    ├── chat.db               # SQLite database (auto-created, local dev only)
    ├── migrations/
    │   ├── env.py            # Wires SQLAlchemy metadata into Alembic; resolves DB path
    │   └── versions/         # Migration files
    └── app/
        ├── main.py           # FastAPI app, lifespan (runs migrations), mounts static
        ├── api/
        │   └── chat.py       # GET / and WebSocket /ws routes
        ├── core/
        │   └── config.py     # Constants, path roots, DATA_DIR env var
        ├── db/
        │   ├── models.py     # SQLAlchemy table definitions (schema source of truth)
        │   └── repository.py # save_message / load_history (aiosqlite)
        └── ws/
            └── manager.py    # WebSocketManager + module-level singleton
```

## Features

### UX / Frontend

- **Auto-reconnect** — Exponential backoff on disconnect (1 s → 2 s → … → 30 s max). Header shows "reconnecting...".
- **Message delivery ticks** — Single ✓ on send; animated green ✓✓ when the server ACKs receipt.
- **Typing indicator** — Shows "[username] is typing..." in the header, clears after 2 s of inactivity.
- **Sender identity** — Every bubble shows the sender's username above the message text.
- **Message history** — Last 50 messages per room are loaded from SQLite on join, shown above a divider.
- **Username prompt** — Modern modal on first visit; username persisted in `localStorage`.

### Reliability / Backend

- **Graceful broadcast** — Each `send_json` is wrapped individually; a broken connection never interrupts other clients.
- **Heartbeat / ping-pong** — Server pings every 5 minutes; unresponsive connections are detected and cleaned up.

### Architecture

- **Rooms/channels** — Connections and history are isolated by room ID. Join with `?room=<name>`.
- **Persistent history** — Messages are stored in SQLite and survive server restarts.
- **Schema versioning** — Alembic manages all schema changes. `alembic upgrade head` runs automatically at startup.
- **Docker support** — Single-command build and run via Docker Compose; database persisted in a named volume.

### Security

- **XSS prevention** — `html.escape()` on the backend; `textContent` (never `innerHTML`) on the frontend.

---

## Running with Docker (recommended)

```bash
# Build and start
docker compose up --build

# Run in the background
docker compose up -d --build

# Stream logs
docker compose logs -f

# Stop
docker compose down

# Stop and delete the database volume
docker compose down -v
```

The app is available at `http://localhost:8000`. The database is stored in a named Docker volume (`chat_data`) and persists across restarts and rebuilds.

---

## Running Locally

```bash
# 1. Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# 2. Install dependencies
cd backend
pip install -r requirements.txt

# 3. Start the server
uvicorn app.main:app --reload
```

The server starts on `http://localhost:8000`. Alembic applies any pending migrations on startup and creates `backend/chat.db` if it doesn't exist.

Open a second tab at `http://localhost:8000?room=other` to test rooms.

---

## Database Migrations (Alembic)

All schema changes go through Alembic. Run commands from the `backend/` directory.

```bash
# Apply all pending migrations (also runs automatically on server start)
alembic upgrade head

# Roll back the last migration
alembic downgrade -1

# Check which migration is currently applied
alembic current

# View full migration history
alembic history

# Generate a new migration after editing db/models.py
alembic revision --autogenerate -m "describe the change"
```

### Schema

Defined in `backend/app/db/models.py` using SQLAlchemy Core. The `messages` table:

| Column      | Type    | Notes                       |
|-------------|---------|-----------------------------|
| `id`        | INTEGER | Primary key, autoincrement  |
| `room_id`   | TEXT    | Room the message belongs to |
| `msg_id`    | TEXT    | Client-generated UUID       |
| `username`  | TEXT    | Sender's display name       |
| `message`   | TEXT    | Sanitized message content   |
| `timestamp` | TEXT    | ISO 8601 UTC timestamp      |

Index: `idx_room (room_id, id)` — supports history queries filtered by room and ordered by id.

---

## WebSocket API

**URL:** `ws://localhost:8000/ws?room=default`

### Client → Server

```json
{ "type": "message", "id": "<uuid>", "message": "Hello", "username": "Alice" }
{ "type": "typing", "username": "Alice" }
{ "type": "pong" }
```

### Server → Client

```json
{ "type": "message", "id": "<uuid>", "message": "Hello", "username": "Alice", "timestamp": "2026-05-30T12:00:00Z", "history": false }
{ "type": "ack", "id": "<uuid>" }
{ "type": "typing", "username": "Alice" }
{ "type": "ping" }
```

---

## Configuration

| Location        | Name              | Default | Description                      |
|-----------------|-------------------|---------|----------------------------------|
| `core/config.py` | `MAX_HISTORY`    | `50`    | Messages replayed on join        |
| `core/config.py` | `PING_INTERVAL`  | `300`   | Heartbeat interval (seconds)     |
| `core/config.py` | `DATA_DIR`       | `backend/` | DB directory; set via `DATA_DIR` env var |
| `script.js`     | `reconnectDelay`  | `1000`  | Initial reconnect delay (ms)     |
| `script.js`     | `maxReconnectDelay` | `30000` | Max reconnect delay (ms)       |

`DATA_DIR` is the only setting that differs between local dev and Docker. Docker Compose sets it to `/app/data`, which is backed by the `chat_data` named volume.

---

## Tech Stack

- **Backend:** Python 3.12, FastAPI, uvicorn, aiosqlite, SQLAlchemy Core, Alembic
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Infrastructure:** Docker, Docker Compose

---

## Testing Checklist

- [ ] **Auto-reconnect:** Stop the server → "reconnecting..." → restart → reconnects automatically
- [ ] **Delivery ticks:** Send a message → ✓ → server ACK → ✓✓ (green)
- [ ] **Typing indicator:** Type in one tab → other tab shows "[User] is typing..."
- [ ] **Sender identity:** Open two tabs with different usernames → bubbles show sender name
- [ ] **History:** Send messages → refresh page → messages reload with "Earlier messages" divider
- [ ] **Persistence:** Send messages → restart server → history still loads
- [ ] **Rooms:** Open `?room=a` and `?room=b` → messages stay isolated
- [ ] **XSS:** Send `<script>alert('xss')</script>` → renders as plain text
- [ ] **Docker:** `docker compose up --build` → app loads → send messages → `docker compose down` → `docker compose up` → history still loads

---

## Troubleshooting

**WebSocket won't connect** — Ensure the backend is running on port 8000 and check the browser console.

**Migration error on startup** — Run `alembic upgrade head` manually from `backend/` to see the full error.

**`chat.db` permission error (local)** — Ensure the process has write access to `backend/`.

**Permission error in Docker** — The container runs as root by default; check that the volume mount is writable.

**"offline" status persists** — Restart the server and hard-refresh the browser.

---

## License

MIT
