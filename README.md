# WebSocket Chat Application

A real-time, multi-room WebSocket chat application with reliability, security, and UX features. Built with FastAPI and vanilla JavaScript.

## Project Structure

```
ws_charts/
├── frontend/
│   ├── index.html        # Main HTML
│   ├── styles.css        # WhatsApp-style dark theme
│   └── script.js         # WebSocket client (auto-reconnect, typing, ticks)
│
└── backend/
    ├── requirements.txt
    ├── alembic.ini           # Alembic configuration
    ├── chat.db               # SQLite database (auto-created on first run)
    ├── migrations/
    │   ├── env.py            # Alembic env — wires in metadata, resolves DB path
    │   └── versions/         # Migration files
    └── app/
        ├── app.py            # FastAPI app, WebSocket endpoint, lifespan
        ├── manager.py        # WebSocket connection manager
        ├── models.py         # SQLAlchemy table definitions (schema source of truth)
        └── database.py       # aiosqlite async query helpers
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
- **Persistent history** — Messages are stored in SQLite via `aiosqlite` and survive server restarts.
- **Schema versioning** — Alembic manages all schema changes. `alembic upgrade head` runs automatically at startup.

### Security

- **XSS prevention** — `html.escape()` on the backend; `textContent` (never `innerHTML`) on the frontend.

## Setup

```bash
# 1. Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# 2. Install dependencies
cd backend
pip install -r requirements.txt
```

## Running

```bash
cd backend
uvicorn app.app:app --reload
```

The server starts on `http://localhost:8000`. Alembic applies any pending migrations automatically on startup, creating `backend/chat.db` if it doesn't exist.

Open a second tab at `http://localhost:8000?room=other` to test rooms.

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

# Add a new migration after editing models.py
alembic revision --autogenerate -m "describe the change"
```

### Schema

Defined in `backend/app/models.py` using SQLAlchemy Core. The `messages` table:

| Column      | Type    | Notes                        |
|-------------|---------|------------------------------|
| `id`        | INTEGER | Primary key, autoincrement   |
| `room_id`   | TEXT    | Room the message belongs to  |
| `msg_id`    | TEXT    | Client-generated UUID        |
| `username`  | TEXT    | Sender's display name        |
| `message`   | TEXT    | Sanitized message content    |
| `timestamp` | TEXT    | ISO 8601 UTC timestamp       |

Index: `idx_room (room_id, id)` — supports history queries filtered by room and ordered by id.

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

## Configuration

| Location | Constant | Default | Description |
|----------|----------|---------|-------------|
| `database.py` | `MAX_HISTORY` | `50` | Messages loaded on join |
| `manager.py` | `PING_INTERVAL` | `300` | Heartbeat interval (seconds) |
| `script.js` | `reconnectDelay` | `1000` | Initial reconnect delay (ms) |
| `script.js` | `maxReconnectDelay` | `30000` | Max reconnect delay (ms) |

## Tech Stack

- **Backend:** Python 3.10+, FastAPI, uvicorn, aiosqlite, SQLAlchemy Core, Alembic
- **Frontend:** HTML5, CSS3, Vanilla JavaScript

## Testing Checklist

- [ ] **Auto-reconnect:** Stop the server → "reconnecting..." → restart → reconnects automatically
- [ ] **Delivery ticks:** Send a message → ✓ → server ACK → ✓✓ (green)
- [ ] **Typing indicator:** Type in one tab → other tab shows "[User] is typing..."
- [ ] **Sender identity:** Open two tabs with different usernames → bubbles show sender name
- [ ] **History:** Send messages → refresh page → messages reload with "Earlier messages" divider
- [ ] **Persistence:** Send messages → restart server → history still loads
- [ ] **Rooms:** Open `?room=a` and `?room=b` → messages stay isolated
- [ ] **XSS:** Send `<script>alert('xss')</script>` → renders as plain text

## Troubleshooting

**WebSocket won't connect** — Ensure the backend is running on port 8000 and check the browser console.

**Migration error on startup** — Run `alembic upgrade head` manually from `backend/` to see the full error.

**`chat.db` permission error** — Ensure the process has write access to the `backend/` directory.

**"offline" status persists** — Restart the server (`Ctrl+C`, `uvicorn app.app:app --reload`) and hard-refresh the browser.

## License

MIT
