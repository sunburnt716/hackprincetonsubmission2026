import asyncio
import contextlib
import os

from bleak import BleakClient

from app.ble.pipeline import BleIngestionPipeline

HM10_CHAR = "0000ffe1-0000-1000-8000-00805f9b34fb"
hm10_address = os.getenv("HM10_ADDRESS", "84:C6:92:C1:48:FF")

pipeline = BleIngestionPipeline()
ingestion_queue: asyncio.Queue[bytes] = asyncio.Queue(maxsize=512)


def _decode_for_log(data: bytes) -> str:
    return data.decode("utf-8", errors="ignore").strip()

def on_data(sender, data):
    try:
        ingestion_queue.put_nowait(bytes(data))
    except asyncio.QueueFull:
        print("[BLE] Queue full. Dropping packet to protect runtime.")

    text_preview = _decode_for_log(bytes(data))
    if text_preview:
        print(f"[BLE RAW] {text_preview}")


async def _process_queue() -> None:
    while True:
        payload = await ingestion_queue.get()
        try:
            result = await pipeline.ingest_bytes(
                device_id=hm10_address,
                payload=payload,
            )
            if result["acceptedCount"] > 0 or result["rejectedCount"] > 0:
                print(
                    "[BLE INGEST] "
                    f"accepted={result['acceptedCount']} "
                    f"rejected={result['rejectedCount']}"
                )
        except Exception as exc:  # pragma: no cover - long-running worker guard
            print(f"[BLE ERROR] {exc}")
        finally:
            ingestion_queue.task_done()

async def main():
    print("Connecting...")
    async with BleakClient(hm10_address) as client:
        print("Connected! Listening...\n")
        processor = asyncio.create_task(_process_queue())
        await asyncio.sleep(1)
        await client.start_notify(HM10_CHAR, on_data)
        try:
            while True:
                await asyncio.sleep(0.1)  # tighter loop than before
        finally:
            processor.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await processor


if __name__ == "__main__":
    asyncio.run(main())