import asyncio
from datetime import datetime, timezone
from fastapi.websockets import WebSocket

MAX_HISTORY = 50
PING_INTERVAL = 30


class WebSocketManager:
    def __init__(self):
        self.connections = set()
        self.history = []

    async def connect(self, connection: WebSocket):
        await connection.accept()
        self.connections.add(connection)
        for msg in self.history:
            await self.send_to(connection, {**msg, "history": True})

    async def disconnect(self, connection: WebSocket):
        self.connections.discard(connection)

    async def broadcast(self, data: dict, sender: WebSocket = None):
        if data.get("type") == "message":
            self.history.append(data)
            if len(self.history) > MAX_HISTORY:
                self.history.pop(0)
        for connection in self.connections:
            if connection is not sender:
                try:
                    await connection.send_json(data)
                except Exception:
                    pass

    async def send_to(self, connection: WebSocket, data: dict):
        try:
            await connection.send_json(data)
        except Exception:
            pass

    async def heartbeat(self, connection: WebSocket):
        while True:
            await asyncio.sleep(PING_INTERVAL)
            await self.send_to(connection, {"type": "ping"})
