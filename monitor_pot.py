import asyncio
import json
import sys

try:
    import websockets
except ImportError:
    print("Installing websockets...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "websockets"])
    import websockets

async def stream():
    print("\n=======================================================")
    print("  GRYDAI LIVE POTENTIOMETER DIAGNOSTIC MONITOR")
    print("  Connecting to ws://localhost:8000/ws ...")
    print("  Press Ctrl+C to exit.")
    print("=======================================================\n")
    try:
        async with websockets.connect('ws://localhost:8000/ws') as ws:
            while True:
                msg = await ws.recv()
                d = json.loads(msg)
                m = d.get('metrics', {})
                v = m.get('voltage_sim', 0.0)
                i = m.get('current_sim', 0.0)
                pred = d.get('ai_prediction', {})
                status = pred.get('grid_status', 0)
                status_str = "NORMAL" if status == 0 else ("WARN" if status == 1 else "CRIT")
                
                # Visual ASCII bar (0 to 30A)
                bar_len = int(max(0, min(30, (i / 30.0) * 30)))
                bar = "#" * bar_len + "-" * (30 - bar_len)
                
                sys.stdout.write(f"\rVoltage: {v:5.1f}V | Current: {i:5.2f}A [{bar}] | Status: {status_str}   ")
                sys.stdout.flush()
    except KeyboardInterrupt:
        print("\nMonitor stopped.")
    except Exception as e:
        print(f"\nConnection error: {e}")
        print("Ensure 'python -m backend.main' is running!")

if __name__ == '__main__':
    try:
        asyncio.run(stream())
    except KeyboardInterrupt:
        pass
