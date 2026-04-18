from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass(slots=True)
class ImputationPlaceholder:
    """Template output for a future time-series repair layer."""

    imputed: bool
    reason: str
    device_id: str
    observed_at: datetime
    raw_frame_hex: str
    notes: str


def build_imputation_placeholder(*, device_id: str, reason: str, raw_frame: bytes) -> ImputationPlaceholder:
    """Return a placeholder object until a real imputation algorithm is implemented."""

    return ImputationPlaceholder(
        imputed=False,
        reason=reason,
        device_id=device_id,
        observed_at=datetime.now(timezone.utc),
        raw_frame_hex=raw_frame.hex(),
        notes=(
            "Time-series repair template invoked. "
            "Algorithm intentionally deferred for current phase."
        ),
    )
