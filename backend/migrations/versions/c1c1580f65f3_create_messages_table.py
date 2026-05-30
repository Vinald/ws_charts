"""create messages table

Revision ID: c1c1580f65f3
Revises: 
Create Date: 2026-05-30 21:30:12.874680

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1c1580f65f3'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "messages",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True, nullable=False),
        sa.Column("room_id", sa.Text(), nullable=False),
        sa.Column("msg_id", sa.Text()),
        sa.Column("username", sa.Text()),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("timestamp", sa.Text(), nullable=False),
    )
    op.create_index("idx_room", "messages", ["room_id", "id"])


def downgrade() -> None:
    op.drop_index("idx_room", table_name="messages")
    op.drop_table("messages")
