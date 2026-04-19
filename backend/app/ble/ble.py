import asyncio
import contextlib

from bleak import BleakClient
from sqlalchemy import select

from app.ble.pipeline import BleIngestionPipeline
from app.database import AsyncSessionLocal
from app.models.wearable import WearableDevice

HM10_CHAR = "0000ffe1-0000-1000-8000-00805f9b34fb"
DEVICE_DISCOVERY_INTERVAL_SECONDS = 10

pipeline = BleIngestionPipeline()
ingestion_queues: dict[str, asyncio.Queue[bytes]] = {}


def _decode_for_log(data: bytes) -> str:
    return data.decode("utf-8", errors="ignore").strip()

def on_data(device_id: str, sender, data):
    queue = ingestion_queues.setdefault(device_id, asyncio.Queue(maxsize=512))

    try:
        queue.put_nowait(bytes(data))
    except asyncio.QueueFull:
        print(f"[BLE:{device_id}] Queue full. Dropping packet to protect runtime.")

    text_preview = _decode_for_log(bytes(data))
    if text_preview:
        print(f"[BLE RAW:{device_id}] {text_preview}")


async def _process_queue(device_id: str) -> None:
    queue = ingestion_queues.setdefault(device_id, asyncio.Queue(maxsize=512))

    while True:
        payload = await queue.get()
        try:
            result = await pipeline.ingest_bytes(
                device_id=device_id,
                payload=payload,
            )
            if result["acceptedCount"] > 0 or result["rejectedCount"] > 0:
                print(
                    f"[BLE INGEST:{device_id}] "
                    f"accepted={result['acceptedCount']} "
                    f"rejected={result['rejectedCount']}"
                )
        except Exception as exc:  # pragma: no cover - long-running worker guard
            print(f"[BLE ERROR:{device_id}] {exc}")
        finally:
            queue.task_done()


async def _fetch_registered_device_ids() -> list[str]:
    async with AsyncSessionLocal() as session:
        statement = (
            select(WearableDevice.device_id)
            .where(WearableDevice.is_active.is_(True))
            .where(WearableDevice.patient_id.is_not(None))
        )
        rows = (await session.execute(statement)).all()

    return sorted({str(row[0]) for row in rows if row[0]})


async def _run_device_listener(device_id: str) -> None:
    print(f"[BLE:{device_id}] Connecting...")
    async with BleakClient(device_id) as client:
        print(f"[BLE:{device_id}] Connected. Listening...")
        processor = asyncio.create_task(_process_queue(device_id))
        await asyncio.sleep(1)
        await client.start_notify(HM10_CHAR, lambda sender, data: on_data(device_id, sender, data))
        try:
            while True:
                await asyncio.sleep(0.1)
        finally:
            processor.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await processor


async def _run_device_supervisor(device_id: str) -> None:
    while True:
        try:
            await _run_device_listener(device_id)
        except Exception as exc:  # pragma: no cover - long-running worker guard
            print(f"[BLE:{device_id}] listener failure: {exc}. Retrying in 5s.")
            await asyncio.sleep(5)


async def main() -> None:
    supervisors: dict[str, asyncio.Task] = {}

    while True:
        try:
            registered_ids = await _fetch_registered_device_ids()
        except Exception as exc:  # pragma: no cover - defensive poll guard
            print(f"[BLE] Failed to fetch wearable registry: {exc}")
            await asyncio.sleep(DEVICE_DISCOVERY_INTERVAL_SECONDS)
            continue

        for device_id in registered_ids:
            if device_id in supervisors:
                continue

            ingestion_queues.setdefault(device_id, asyncio.Queue(maxsize=512))
            supervisors[device_id] = asyncio.create_task(_run_device_supervisor(device_id))
            print(f"[BLE] Started device supervisor for registered wearable '{device_id}'.")

        removed_ids = [device_id for device_id in supervisors if device_id not in registered_ids]
        for device_id in removed_ids:
            supervisors[device_id].cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await supervisors[device_id]
            supervisors.pop(device_id, None)
            ingestion_queues.pop(device_id, None)
            print(f"[BLE] Stopped supervisor for unregistered wearable '{device_id}'.")

        if not registered_ids:
            print("[BLE] No paired active wearables registered yet. Waiting...")

        await asyncio.sleep(DEVICE_DISCOVERY_INTERVAL_SECONDS)


if __name__ == "__main__":
    asyncio.run(main())