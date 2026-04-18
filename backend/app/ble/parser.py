from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

BLE_SENTINEL = 0xAA
FRAME_LENGTH = 5  # sentinel + 4 bytes


@dataclass(slots=True)
class ParsedFrame:
    valid: bool
    raw_frame: bytes
    reason: str | None
    blood_oxygen: int | None = None
    heart_beat: int | None = None
    stress: float | None = None
    checksum: str | None = None
    sequence_number: int | None = None


class BleFrameParser:
    """Streaming parser for BLE notifications following the 0xAA framing rule."""

    def __init__(self) -> None:
        self._buffer = bytearray()
        self._sequence_number = 0

    def ingest(self, chunk: bytes) -> list[ParsedFrame]:
        self._buffer.extend(chunk)
        results: list[ParsedFrame] = []

        while True:
            sentinel_index = self._buffer.find(BLE_SENTINEL)
            if sentinel_index == -1:
                self._buffer.clear()
                break

            if sentinel_index > 0:
                del self._buffer[:sentinel_index]

            if len(self._buffer) < FRAME_LENGTH:
                break

            frame = bytes(self._buffer[:FRAME_LENGTH])
            checksum_valid = ((frame[1] + frame[2]) & 0xFF) == frame[4]

            if checksum_valid:
                self._sequence_number += 1
                results.append(
                    ParsedFrame(
                        valid=True,
                        raw_frame=frame,
                        reason=None,
                        blood_oxygen=frame[1],
                        heart_beat=frame[2],
                        stress=float(frame[3]),
                        checksum=f"{frame[4]:02x}",
                        sequence_number=self._sequence_number,
                    )
                )
                del self._buffer[:FRAME_LENGTH]
            else:
                results.append(
                    ParsedFrame(
                        valid=False,
                        raw_frame=frame,
                        reason="checksum_mismatch",
                    )
                )
                del self._buffer[0]

        return results
