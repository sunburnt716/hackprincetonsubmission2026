import asyncio
from bleak import BleakClient

HM10_CHAR = "0000ffe1-0000-1000-8000-00805f9b34fb"
hm10_address = "84:C6:92:C1:48:FF"

def on_data(sender, data):
    print(data.decode("utf-8", errors="ignore").strip())

async def main():
    print("Connecting...")
    async with BleakClient(hm10_address) as client:
        print("Connected! Listening...\n")
        await asyncio.sleep(1)
        await client.start_notify(HM10_CHAR, on_data)
        while True:
            await asyncio.sleep(0.1)  # tighter loop than before

asyncio.run(main())