from fastapi.websockets import WebSocket

class WebSocketManager:
    def __init__(self):
        self.connections = set()

    async def connect(self, connection: WebSocket):
        await connection.accept()
        print(f"Adding connection: {connection.client.host}:{connection.client.port}")
        self.connections.add(connection)
        print(f"Current connections: {[conn.client.host + ':' + str(conn.client.port) for conn in self.connections]}")

    async def disconnect(self, connection: WebSocket):
        print(f"Removing connection: {connection.client.host}:{connection.client.port}")
        self.connections.remove(connection)
        print(f"Current connections: {[conn.client.host + ':' + str(conn.client.port) for conn in self.connections]}")

    async def broadcast(self, message: str):
        for connection in self.connections:
            await connection.send_json({"message": message})
