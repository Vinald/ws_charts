# WebSocket Chat Application

A real-time, multi-room WebSocket chat application with reliability, security, and UX features. Built with FastAPI and vanilla JavaScript over WebSocket.

## Project Structure

```
ws_charts/
├── frontend/
│   ├── index.html        # Main HTML file
│   ├── styles.css        # WhatsApp-style dark theme
│   └── script.js         # WebSocket client logic (with auto-reconnect, typing indicators, etc.)
│
└── backend/
    ├── requirements.txt
    └── app/
        ├── app.py         # FastAPI app and WebSocket endpoint (room support)
        └── manager.py     # WebSocket connection manager (graceful error handling, history)
```

## Features Implemented

### UX / Frontend

- **Auto-reconnect with exponential backoff** — If the WebSocket drops, the client automatically attempts to reconnect with exponential backoff (1s → 2s → 4s → ... → max 30s). Connection status displays "reconnecting...".

- **Message delivery ticks** — Single tick (✓) when sent, animated double tick (✓✓) in green when the server confirms receipt (like WhatsApp's checkmarks). Ticks animate on delivery confirmation with color change and scale effect.

- **Typing indicator** — Shows "[username] is typing..." in the header when another client sends a typing event. Automatically clears after 2 seconds of inactivity.

- **Sender identity** — All messages (sent and received) display the sender's username above the message bubble for clarity in multi-user conversations.

- **Improved username entry UI** — Beautiful, modern dialog with:
  - Gradient background and animated entrance
  - Icon with user profile silhouette
  - Clear, descriptive labels
  - Input field with focus states and visual feedback
  - Inline join button (no separate form submission)
  - Validation feedback with shake animation if name is too short
  - Enter key support for quick joining

### Reliability / Backend

- **Graceful error handling in broadcast** — Each send_message call is wrapped individually in try-except. If one client's connection is broken mid-broadcast, the error is logged and remaining clients still receive messages. Broken connections are automatically cleaned up.

- **Heartbeat / ping-pong** — The server sends a ping every 30 seconds. Clients respond with pong. This detects stale connections (e.g., tab crash) and prevents the manager from holding dead sockets.

### Architecture

- **Message history** — The last 50 messages are stored in memory (per room). When a new client joins, they receive all historical messages marked as "history", with a divider showing "Earlier messages".

- **Rooms/channels** — Connections are namespaced by room ID. Multiple separate chat rooms can coexist. Pass `?room=room_id` in the URL or use the `room` query parameter on the WebSocket connection.

### Security

- **Input sanitization** — Message text is escaped using Python's `html.escape()` on the backend and rendered via `textContent` (not `innerHTML`) on the frontend. This prevents XSS injection attacks from scripts, HTML tags, or other malicious input.

## Setup

## Running the Application

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.app:app --reload
```

The server runs on `http://localhost:8000`

### Frontend

Open `http://localhost:8000` in your browser. You'll be prompted to enter a username.

To join a different room, use: `http://localhost:8000?room=my-room`

## API

### WebSocket Endpoint

**URL:** `ws://localhost:8000/ws?room=default`

**Query Parameters:**
- `room` (optional) — Room ID for isolating conversations. Defaults to "default".

### Message Types

#### Client → Server

**message**

```json
{
  "type": "message",
  "id": "unique-uuid",
  "message": "Hello world",
  "username": "Alice"
}
```

**typing**

```json
{
  "type": "typing",
  "username": "Alice"
}
```

**pong**

```json
{
  "type": "pong"
}
```

#### Server → Client

**message**

```json
{
  "type": "message",
  "timestamp": "2026-05-30T12:34:56.789Z",
  "message": "Hello world",
  "username": "Alice",
  "id": "unique-uuid",
  "history": false
}
```

**ack** (message delivery confirmation)

```json
{
  "type": "ack",
  "id": "unique-uuid"
}
```

**typing**

```json
{
  "type": "typing",
  "username": "Alice"
}
```

**ping** (heartbeat)

```json
{
  "type": "ping"
}
```

## Configuration

Edit these constants in `manager.py`:

```python
MAX_HISTORY = 50      # Number of messages to retain per room
PING_INTERVAL = 30    # Heartbeat interval in seconds
```

## Security Notes

1. **XSS Prevention:** All user input is HTML-escaped on the backend and rendered via `textContent` on the frontend.
2. **Connection Cleanup:** Dead connections are detected via heartbeat and automatically removed.
3. **Error Isolation:** Broadcast errors don't crash the server or affect other clients.

## Future Enhancements

- Persist message history to SQLite
- User authentication and authorization
- Direct messaging between users
- Message reactions and replies
- File/image sharing
- Encrypted end-to-end messaging

### WebSocket message format

```json
{ "message": "hello" }
```

## Implementation Details

### Auto-reconnect with Exponential Backoff

- **File:** `frontend/script.js` - `scheduleReconnect()` method
- Initial delay: 1000ms, doubles on each attempt, caps at 30000ms (30s)
- Displays "reconnecting..." status in yellow
- Resets to 1000ms on successful connection

### Message Delivery Ticks

- **File:** `frontend/script.js` - `addMessage()` and `handleMessage()` methods
- Single tick (✓) on send, double tick (✓✓) in blue on server ACK
- Tracked via `pendingMessages` Map with message UUID

### Typing Indicator

- **File:** `frontend/script.js` - `setupEventListeners()` and `showTypingIndicator()` methods
- Sends `{type: "typing"}` on input (throttled to 1s intervals)
- Displays "[username] is typing..." in green, italic
- Auto-clears after 2s of inactivity

### Sender Identity

- **File:** `frontend/script.js` - `addMessage()` method
- All received messages display sender's username above bubble
- Username styled in green (#25d366) with smaller font

### Graceful Error Handling

- **File:** `backend/app/manager.py` - `broadcast()` method
- Each client send wrapped individually in try-except
- Broken connections detected and cleaned up
- Other clients unaffected if one connection fails

### Heartbeat / Ping-Pong

- **File:** `backend/app/manager.py` - `heartbeat()` method
- Server sends ping every 30 seconds (configurable via `PING_INTERVAL`)
- Clients respond with pong
- Detects stale connections (tab crash, network drop)

### Message History

- **File:** `backend/app/manager.py` - `self.history` dict
- Stores last 50 messages per room (configurable via `MAX_HISTORY`)
- Sent to new clients on connect with `"history": True` flag
- Visual divider shows "Earlier messages" separating old from new

### Rooms/Channels

- **File:** `backend/app/app.py` and `backend/app/manager.py`
- URL parameter: `?room=room_id` (defaults to "default")
- Each room has isolated connections and history
- Multiple rooms can coexist with zero interference

### Input Sanitization (XSS Prevention)

- **Backend:** `backend/app/manager.py` - `broadcast()` method uses `html.escape()`
- **Frontend:** `frontend/script.js` - `addMessage()` method uses `textContent` instead of `innerHTML`
- Escapes HTML special characters: `<` → `&lt;`, `>` → `&gt;`, `&` → `&amp;`, etc.
- Defense-in-depth: both backend AND frontend protection

## Configuration

Edit constants in `backend/app/manager.py`:

```python
MAX_HISTORY = 50      # Messages retained per room (default: 50)
PING_INTERVAL = 30    # Heartbeat frequency in seconds (default: 30)
```

Edit constants in `frontend/script.js`:

```javascript
reconnectDelay = 1000           // Initial backoff (1 second)
maxReconnectDelay = 30000       // Max backoff (30 seconds)
```

## Testing Checklist

- [ ] **Auto-reconnect:** Disable network → see "reconnecting..." → enable → reconnects
- [ ] **Delivery ticks:** Send message → ✓ → ACK arrives → ✓✓ (blue)
- [ ] **Typing indicator:** Type in one client → other shows "[User] is typing..."
- [ ] **Sender identity:** Open 2 tabs with different usernames → bubbles show sender
- [ ] **Error handling:** Crash one tab → other tabs still receive messages
- [ ] **Heartbeat:** Leave idle 1+ minute → connection stays alive
- [ ] **Rooms:** Open `?room=a` and `?room=b` → messages don't cross rooms
- [ ] **XSS prevention:** Send `<script>alert('xss')</script>` → renders as plain text

## Tech Stack

- **Backend:** Python 3.10+, FastAPI, uvicorn, WebSocket
- **Frontend:** HTML5, CSS3, Vanilla JavaScript (no framework)

## Troubleshooting

**WebSocket won't connect** — Ensure backend runs on port 8000 and check browser console for errors.

**Static files not loading** — Confirm `frontend/` folder exists at project root with all files.

**Messages not appearing** — Check browser console for JavaScript errors or network tab for WebSocket issues.

**"offline" status persists** — Kill the process (Ctrl+C) and restart the server; clear browser cache.

## Future Enhancements

- Persist message history to SQLite
- User authentication and authorization
- Direct messaging between users
- Message reactions and replies
- File/image sharing
- Encrypted end-to-end messaging
- Read receipts beyond double-tick

## License

MIT
