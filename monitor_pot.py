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
    print("  GRYDAI DUAL POTENTIOMETER (V & I) DIAGNOSTIC MONITOR")
    print("  Connecting to ws://localhost:8000/ws ...")
    print("  Press Ctrl+C to exit.")
    print("=======================================================\n")
    last_status = None
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
                msg_text = pred.get('message', 'Normal')
                status_str = "NORMAL" if status == 0 else ("WARN" if status == 1 else "CRIT")
                
                # Visual ASCII bar for Voltage (180V to 260V -> 0 to 16 chars)
                v_ratio = max(0.0, min(1.0, (v - 180.0) / 80.0))
                v_bar_len = int(v_ratio * 16)
                v_bar = "#" * v_bar_len + "-" * (16 - v_bar_len)

                # Visual ASCII bar for Current (0A to 30A -> 0 to 16 chars)
                i_ratio = max(0.0, min(1.0, i / 30.0))
                i_bar_len = int(i_ratio * 16)
                i_bar = "#" * i_bar_len + "-" * (16 - i_bar_len)

                # If status changed, print a permanent line
                if last_status is not None and status != last_status:
                    print(f"\n[TRANSITION] >>> Status changed to {status_str} | {msg_text}")
                last_status = status
                
                sys.stdout.write(f"\rV: {v:5.1f}V [{v_bar}] | I: {i:5.2f}A [{i_bar}] | [{status_str}] {msg_text}     ")
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
