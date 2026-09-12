import asyncio
import json
import urllib.request
import websockets

async def run_fault_test():
    url = "ws://localhost:8000/ws"
    async with websockets.connect(url) as ws:
        print("Connected to WebSocket. Reading 5 normal baseline packets...")
        for _ in range(5):
            msg = json.loads(await ws.recv())
            v = msg["metrics"]["voltage_sim"]
            i = msg["metrics"]["current_sim"]
            st = msg["ai_prediction"]["grid_status"]
            sc = msg["ai_prediction"]["anomaly_score"]
            print(f"NORMAL -> V: {v:5.1f}V | I: {i:4.2f}A | Status: {st} | Score: {sc:+.2f}")

        # Inject EV Surge asynchronously so TCP buffer doesn't queue old messages
        print("\n>>> INJECTING EV SURGE (Current spike to ~25A)...")
        req = urllib.request.Request(
            "http://localhost:8000/api/inject-fault",
            data=json.dumps({"fault_type": "ev_surge", "duration_sec": 5.0}).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        await asyncio.to_thread(urllib.request.urlopen, req)

        # Drain any stale buffered messages from before the injection
        while True:
            try:
                await asyncio.wait_for(ws.recv(), timeout=0.02)
            except asyncio.TimeoutError:
                break

        print("Listening for live ML detection at 10 Hz...")
        for i in range(20):
            msg = json.loads(await ws.recv())
            v = msg["metrics"]["voltage_sim"]
            i_val = msg["metrics"]["current_sim"]
            st = msg["ai_prediction"]["grid_status"]
            sc = msg["ai_prediction"]["anomaly_score"]
            txt = msg["ai_prediction"]["message"]
            alert = "[GREEN]" if st == 0 else ("[YELLOW - WARN]" if st == 1 else "[RED - CRITICAL]")
            print(f"Sample #{i+1:02d} {alert} -> V: {v:5.1f}V | I: {i_val:4.2f}A | Status: {st} | Score: {sc:+.2f} | {txt}")

if __name__ == "__main__":
    asyncio.run(run_fault_test())
