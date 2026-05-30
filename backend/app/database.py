import aiosqlite
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "chat.db"
MAX_HISTORY = 50


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                room_id   TEXT    NOT NULL,
                msg_id    TEXT,
                username  TEXT,
                message   TEXT    NOT NULL,
                timestamp TEXT    NOT NULL
            )
        """)
        await db.execute("CREATE INDEX IF NOT EXISTS idx_room ON messages (room_id, id)")
        await db.commit()


async def save_message(room_id: str, data: dict):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO messages (room_id, msg_id, username, message, timestamp) VALUES (?,?,?,?,?)",
            (room_id, data.get("id"), data.get("username"), data["message"], data["timestamp"]),
        )
        await db.commit()


async def load_history(room_id: str) -> list[dict]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            """
            SELECT msg_id, username, message, timestamp
            FROM (
                SELECT * FROM messages WHERE room_id = ?
                ORDER BY id DESC LIMIT ?
            ) ORDER BY id ASC
            """,
            (room_id, MAX_HISTORY),
        ) as cursor:
            rows = await cursor.fetchall()
    return [
        {"type": "message", "id": r["msg_id"], "username": r["username"],
         "message": r["message"], "timestamp": r["timestamp"]}
        for r in rows
    ]
