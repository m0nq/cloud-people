import asyncio
import json
import aiohttp
import time
import sys

# Configuration
BASE_URL = "http://localhost:8000"  # Update this to match your service URL
TEST_TASK = "Go to example.com and take a screenshot"  # A simple task for testing

async def test_restart_flow():
    """Test the execute -> pause -> restart flow"""
    async with aiohttp.ClientSession() as session:
        # Step 1: Create a new task
        print("Step 1: Creating a new task...")
        task_data = {
            "task": TEST_TASK,
            "headless": True,
            "operation_timeout": 60
        }
        
        async with session.post(f"{BASE_URL}/execute", json=task_data) as response:
            if response.status != 200:
                print(f"Error creating task: {await response.text()}")
                return
            
            task_result = await response.json()
            task_id = task_result["task_id"]
            print(f"Created task with ID: {task_id}")
            print(f"Task status: {task_result['status']}")
            print(json.dumps(task_result, indent=2))
        
        # Step 2: Wait a bit for the task to start running
        print("\nStep 2: Waiting for task to start running...")
        await asyncio.sleep(5)
        
        # Step 3: Check task status
        async with session.get(f"{BASE_URL}/execute/{task_id}") as response:
            if response.status != 200:
                print(f"Error checking task status: {await response.text()}")
                return
            
            task_status = await response.json()
            print(f"Task status: {task_status['status']}")
            print(json.dumps(task_status, indent=2))
        
        # Step 4: Pause the task
        print("\nStep 4: Pausing the task...")
        async with session.post(f"{BASE_URL}/execute/{task_id}/pause") as response:
            if response.status != 200:
                print(f"Error pausing task: {await response.text()}")
                return
            
            pause_result = await response.json()
            print(f"Task paused. Status: {pause_result['status']}")
            print(json.dumps(pause_result, indent=2))
        
        # Step 5: Restart the task
        print("\nStep 5: Restarting the task...")
        async with session.post(f"{BASE_URL}/execute/{task_id}/restart") as response:
            if response.status != 200:
                print(f"Error restarting task: {await response.text()}")
                return
            
            restart_result = await response.json()
            new_task_id = restart_result["task_id"]
            print(f"Task restarted. New task ID: {new_task_id}")
            print(f"New task status: {restart_result['status']}")
            print(json.dumps(restart_result, indent=2))
        
        # Step 6: Wait for the new task to complete
        print("\nStep 6: Waiting for new task to complete...")
        max_wait = 60  # Maximum wait time in seconds
        wait_interval = 5  # Check every 5 seconds
        
        for _ in range(max_wait // wait_interval):
            await asyncio.sleep(wait_interval)
            
            async with session.get(f"{BASE_URL}/execute/{new_task_id}") as response:
                if response.status != 200:
                    print(f"Error checking new task status: {await response.text()}")
                    continue
                
                new_task_status = await response.json()
                print(f"New task status: {new_task_status['status']}")
                
                if new_task_status["status"] in ["completed", "failed"]:
                    print("Task completed!")
                    print(json.dumps(new_task_status, indent=2))
                    break
        else:
            print(f"Timed out waiting for task to complete after {max_wait} seconds")
        
        # Step 7: Check the original task status (should be cancelled)
        print("\nStep 7: Checking original task status...")
        async with session.get(f"{BASE_URL}/execute/{task_id}") as response:
            if response.status != 200:
                print(f"Error checking original task status: {await response.text()}")
                return
            
            original_task_status = await response.json()
            print(f"Original task status: {original_task_status['status']}")
            print(json.dumps(original_task_status, indent=2))

if __name__ == "__main__":
    print("Testing the execute -> pause -> restart flow")
    asyncio.run(test_restart_flow()) 