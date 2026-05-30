from sqlalchemy import Column, Index, Integer, MetaData, Table, Text

metadata = MetaData()

messages = Table(
    "messages",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("room_id", Text, nullable=False),
    Column("msg_id", Text),
    Column("username", Text),
    Column("message", Text, nullable=False),
    Column("timestamp", Text, nullable=False),
    Index("idx_room", "room_id", "id"),
)
