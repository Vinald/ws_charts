import asyncio
from fastapi.websockets import WebSocket
from html import escape
from .database import load_history, save_message

PING_INTERVAL = 300  # 5 minutes


class WebSocketManager:
    def __init__(self):
        self.connections = {}  # room_id -> set of connections
        self.user_data = {}    # connection -> {room_id}

    async def connect(self, connection: WebSocket, room_id: str = "default"):
        await connection.accept()

        if room_id not in self.connections:
            self.connections[room_id] = set()

        self.connections[room_id].add(connection)
        self.user_data[connection] = {"room_id": room_id}

        for msg in await load_history(room_id):
            await self.send_to(connection, {**msg, "history": True})

    async def disconnect(self, connection: WebSocket):
        if connection in self.user_data:
            room_id = self.user_data[connection]["room_id"]
            self.connections[room_id].discard(connection)
            del self.user_data[connection]

    async def broadcast(self, data: dict, sender: WebSocket = None):
        if sender not in self.user_data:
            return
        
        room_id = self.user_data[sender]["room_id"]
        
        if data.get("type") == "message":
            if "message" in data:
                data["message"] = escape(data["message"])
            await save_message(room_id, data)
        
        # Graceful error handling: wrap each send individually
        disconnected_clients = set()
        for connection in self.connections.get(room_id, set()):
            # Skip sender - they already displayed the message locally
            if connection is sender:
                continue
                
            try:
                await connection.send_json(data)
            except Exception as e:
                print(f"Failed to send message to client: {e}")
                disconnected_clients.add(connection)
        
        # Clean up broken connections
        for connection in disconnected_clients:
            await self.disconnect(connection)

    async def send_to(self, connection: WebSocket, data: dict):
        try:
            await connection.send_json(data)
        except Exception as e:
            print(f"Failed to send message: {e}")
            await self.disconnect(connection)

    async def heartbeat(self, connection: WebSocket):
        while True:
            await asyncio.sleep(PING_INTERVAL)
            await self.send_to(connection, {"type": "ping"})
