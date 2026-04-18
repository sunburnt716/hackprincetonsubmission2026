"""simplify vitals_records schema

Revision ID: c3d7a1f2e8b4
Revises: 59a3c98baebc
Create Date: 2026-04-18 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "c3d7a1f2e8b4"
down_revision: Union[str, None] = "59a3c98baebc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_index("ix_vitals_records_backfill_batch_id", table_name="vitals_records")
    op.drop_column("vitals_records", "record_id")
    op.drop_column("vitals_records", "sequence_number")
    op.drop_column("vitals_records", "checksum")
    op.drop_column("vitals_records", "ack_state")
    op.drop_column("vitals_records", "retry_count")
    op.drop_column("vitals_records", "essential_vitals_only")
    op.drop_column("vitals_records", "buffered_during_dead_zone")
    op.drop_column("vitals_records", "backfill_batch_id")
    op.execute("DROP TYPE IF EXISTS ack_state")


def downgrade() -> None:
    op.add_column("vitals_records", sa.Column("backfill_batch_id", sa.String(100), nullable=True))
    op.add_column("vitals_records", sa.Column("buffered_during_dead_zone", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("vitals_records", sa.Column("essential_vitals_only", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("vitals_records", sa.Column("retry_count", sa.Integer(), nullable=False, server_default="0"))
    op.execute("CREATE TYPE ack_state AS ENUM ('pending', 'acknowledged', 'failed')")
    op.add_column("vitals_records", sa.Column("ack_state", sa.Enum("pending", "acknowledged", "failed", name="ack_state"), nullable=False, server_default="acknowledged"))
    op.add_column("vitals_records", sa.Column("checksum", sa.String(64), nullable=False, server_default=""))
    op.add_column("vitals_records", sa.Column("sequence_number", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("vitals_records", sa.Column("record_id", sa.String(50), nullable=False, server_default=""))
    op.create_index("ix_vitals_records_backfill_batch_id", "vitals_records", ["backfill_batch_id"])
