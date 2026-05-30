from fastapi import FastAPI
from fastapi.templating import Jinja2Templates
from fastapi.requests import Request
from fastapi.websockets import WebSocket
from .manager import WebSocketManager

app = FastAPI()
templates = Jinja2Templates(directory="templates")
manager = WebSocketManager()


@app.get("/")
async def root(request: Request):
    return templates.TemplateResponse(request, "index.html", {})


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
