import asyncio
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.websockets import WebSocket
from pathlib import Path
from .manager import WebSocketManager

app = FastAPI()
manager = WebSocketManager()

frontend_path = Path(__file__).parent.parent.parent / "frontend"
app.mount("/static", StaticFiles(directory=frontend_path), name="static")


@app.get("/")
async def root():
    frontend_path = Path(__file__).parent.parent.parent / "frontend"
    return FileResponse(frontend_path / "index.html", media_type="text/html")


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    beat = asyncio.create_task(manager.heartbeat(websocket))
    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type", "message")

            if msg_type == "message":
                data["timestamp"] = datetime.now(timezone.utc).isoformat()
                await manager.send_to(websocket, {"type": "ack", "id": data.get("id")})
                await manager.broadcast(data, sender=websocket)

            elif msg_type == "typing":
                await manager.broadcast(data, sender=websocket)

            elif msg_type == "pong":
                pass  # connection is alive

    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        beat.cancel()
        await manager.disconnect(websocket)
