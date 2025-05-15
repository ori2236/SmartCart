import sys
import os
import json
import asyncio
from bestBranches import get_best_supermarkets

base_dir = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../..")
)
sys.path.insert(0, base_dir)

async def process_request(data):
    try:
        cart = data["cart"]
        address = data["address"]
        alpha = data.get("alpha", 0.5)

        supermarkets, recommendations = await get_best_supermarkets(cart, address, alpha)

        return {
            "supermarkets": supermarkets,
            "recommendations": recommendations
        }
    except Exception as e:
        return {"error": str(e)}

async def main():
    #listen for lines from stdin
    while True:
        try:
            #read one line from stdin, decode safely
            line = await asyncio.get_event_loop().run_in_executor(None, lambda: sys.stdin.buffer.readline().decode('utf-8', errors='replace'))
            if not line:
                break

            data = json.loads(line.strip())
            result = await process_request(data)

        except Exception as e:
            result = {"error": str(e)}

        print(json.dumps(result, ensure_ascii=False), flush=True)



if __name__ == "__main__":
    asyncio.run(main())
