import asyncio
from datetime import datetime, timezone

from fastapi import APIRouter, Query
from fastapi.responses import FileResponse
from fastapi.websockets import WebSocket

from app.core.config import FRONTEND_DIR
from app.ws.manager import manager

router = APIRouter()


@router.get("/")
async def root():
    return FileResponse(FRONTEND_DIR / "index.html", media_type="text/html")


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, room: str = Query("default")):
    await manager.connect(websocket, room_id=room)
    beat = asyncio.create_task(manager.heartbeat(websocket))
    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type", "message")

            if msg_type == "message":
                data["timestamp"] = datetime.now(timezone.utc).isoformat()
                msg_id = data.get("id")
                await manager.send_to(websocket, {"type": "ack", "id": msg_id})
                await manager.broadcast(data, sender=websocket)

            elif msg_type == "typing":
                await manager.broadcast(data, sender=websocket)

            elif msg_type == "pong":
                pass

    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        beat.cancel()
        await manager.disconnect(websocket)
