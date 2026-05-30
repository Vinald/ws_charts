from email import message

from fastapi.websockets import WebSocket


class WebSocketManager:
    def __init__(self):
        self.connections = set()

    async def connect(self, connection: WebSocket):
        await connection.accept()
        print(f"Adding connection: {connection.client.host}:{connection.client.port}")
        self.connections.add(connection)
        print(
            f"Current connections: {[conn.client.host + ':' + str(conn.client.port) for conn in self.connections]}"
        )
        welcome_message = {
            "client": f"{connection.client.host}:{connection.client.port}",
            "message": "Connected to WebSocket server"
        }
        await connection.send_json(welcome_message)

    async def disconnect(self, connection: WebSocket):
        print(f"Removing connection: {connection.client.host}:{connection.client.port}")
        self.connections.remove(connection)
        print(
            f"Current connections: {[conn.client.host + ':' + str(conn.client.port) for conn in self.connections]}"
        )

    async def send_message(self, rec_message: dict):
        for connection in self.connections:
            await connection.send_json(rec_message)
