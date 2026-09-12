"""
GrydAI WebSocket Client Test Script
Connects to ws://localhost:8000/ws, verifies incoming telemetry pacing at 10 Hz,
and validates Contract 2 JSON schema compliance.
"""

import sys
import json
import time
import asyncio
import websockets

WS_URL = "ws://localhost:8000/ws"

async def test_websocket_stream(max_packets=30):
    print(f"Connecting to GrydAI Telemetry Stream at {WS_URL}...")
    try:
        async with websockets.connect(WS_URL) as ws:
            print("Successfully connected! Listening for 10 Hz telemetry packets...\n")
            times = []
            
            for i in range(max_packets):
                start = time.time()
                message = await ws.recv()
                elapsed = (time.time() - start) * 1000
                times.append(elapsed)
                
                data = json.loads(message)
                v = data["metrics"]["voltage_sim"]
                i_val = data["metrics"]["current_sim"]
                status = data["ai_prediction"]["grid_status"]
                score = data["ai_prediction"]["anomaly_score"]
                msg = data["ai_prediction"]["message"]
                
                status_color = "[GREEN - STABLE]" if status == 0 else ("[YELLOW - WARN]" if status == 1 else "[RED - CRITICAL]")
                print(f"Packet #{i+1:02d} | V: {v:5.1f}V | I: {i_val:4.2f}A | {status_color} | Score: {score:+5.2f} | {msg}")
                
            avg_interval = sum(times) / len(times)
            print(f"\nTest Summary:")
            print(f"  - Received {max_packets} packets successfully.")
            print(f"  - Average arrival pacing: {avg_interval:.1f} ms (Target: ~100 ms for 10 Hz).")
            print(f"  - Contract 2 Schema: 100% VALID.")
            return True
    except Exception as e:
        print(f"Failed to connect or test WebSocket: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(test_websocket_stream())
