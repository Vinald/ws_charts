import asyncio
from datetime import datetime, timezone
from fastapi.websockets import WebSocket
from html import escape

MAX_HISTORY = 50
PING_INTERVAL = 300  # Increased to 5 minutes to reduce noise


class WebSocketManager:
    def __init__(self):
        self.connections = {}  # room_id -> set of connections
        self.history = {}  # room_id -> list of messages
        self.user_data = {}  # connection -> {username, room_id}

    async def connect(self, connection: WebSocket, room_id: str = "default"):
        await connection.accept()
        
        if room_id not in self.connections:
            self.connections[room_id] = set()
            self.history[room_id] = []
        
        self.connections[room_id].add(connection)
        self.user_data[connection] = {"room_id": room_id}
        
        # Send message history to new client
        for msg in self.history[room_id]:
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
            # Sanitize message text to prevent XSS
            if "message" in data:
                data["message"] = escape(data["message"])
            
            self.history[room_id].append(data)
            if len(self.history[room_id]) > MAX_HISTORY:
                self.history[room_id].pop(0)
        
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
