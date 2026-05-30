# WebSocket Chat

A real-time chat application with a WhatsApp-style UI, built with FastAPI and vanilla JavaScript over WebSocket.

## Project Structure

```
ws_charts/
├── frontend/
│   ├── index.html        # Main HTML file
│   ├── styles.css        # WhatsApp-style dark theme
│   └── script.js         # WebSocket client logic
│
└── backend/
    ├── requirements.txt
    └── app/
        ├── app.py         # FastAPI app and WebSocket endpoint
        └── manager.py     # WebSocket connection manager
```

## Features

- **Real-time messaging** via WebSocket
- **WhatsApp-style UI** — dark theme, sent/received bubbles, green accents
- **Multi-client broadcast** — messages from one client are sent to all others
- **Connection status** — live online/offline indicator in the header

## Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.app:app --reload --host 0.0.0.0 --port 8000
```

The server runs at `http://localhost:8000`.

### Frontend

Served automatically by the backend — no build step needed. Open `http://localhost:8000` in your browser.

## Usage

1. Open `http://localhost:8000` in one or more browser tabs
2. Type a value in the input field and press Enter or click Send
3. Your message appears on the right; messages from other clients appear on the left

## API

| Type      | Path              | Description                        |
|-----------|-------------------|------------------------------------|
| HTTP GET  | `/`               | Serves the frontend HTML           |
| HTTP GET  | `/static/{file}`  | Serves CSS and JS assets           |
| WebSocket | `/ws`             | Real-time messaging endpoint       |

### WebSocket message format

```json
{ "message": "hello" }
```

## Tech Stack

- **Backend:** Python, FastAPI, WebSocket
- **Frontend:** HTML, CSS, JavaScript (no framework)

## Troubleshooting

**WebSocket won't connect** — make sure the backend is running on port 8000 and check the browser console for errors.

**Static files not loading** — confirm the `frontend/` folder is at the project root and the server started without errors.

## License

MIT
