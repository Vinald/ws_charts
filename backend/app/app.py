from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.requests import Request
from fastapi.responses import FileResponse
from fastapi.websockets import WebSocket
from pathlib import Path
from .manager import WebSocketManager

app = FastAPI()
manager = WebSocketManager()

# Serve static files (CSS, JS)
frontend_path = Path(__file__).parent.parent.parent / "frontend"
app.mount("/static", StaticFiles(directory=frontend_path), name="static")


@app.get("/")
async def root():
    frontend_path = Path(__file__).parent.parent.parent / "frontend"
    return FileResponse(frontend_path / "index.html", media_type="text/html")


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            message = await websocket.receive_json()
            print(f"WebSocket received: {message}")
            await manager.send_message(message)
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        await manager.disconnect(websocket)
