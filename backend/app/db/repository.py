import aiosqlite

from app.core.config import DATA_DIR, MAX_HISTORY

DB_PATH = DATA_DIR / "chat.db"


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
