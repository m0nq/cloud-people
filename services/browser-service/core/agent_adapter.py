"""
Agent Adapter for browser-use library integration.

This module provides an adapter between our service API and the browser-use library's Agent class.
It handles the conversion between our request/response formats and the browser-use library's API.
"""

import logging
import os
import uuid
from typing import Any, Dict, Optional

from browser_use import Agent
from browser_use import BrowserConfig
from browser_use import BrowserContextConfig

from strategies.llm.factory import LLMProviderFactory

logger = logging.getLogger(__name__)

class AgentAdapter:
    """
    Adapter for the browser-use Agent class.
    
    This class provides a bridge between our service API and the browser-use library's Agent class.
    It handles the conversion between our request/response formats and the browser-use library's API.
    """
    
    def __init__(self):
        """Initialize the adapter."""
        self.active_agents = {}  # Store active agents by task_id
    
    def get_agent_for_task(self, task_id: str) -> Optional[Agent]:
        """Get the agent for a specific task."""
        return self.active_agents.get(task_id)
    
    async def create_agent(
        self,
        task: str,
        llm_provider: str,
        headless: bool = False,
        persistent_session: bool = False,
        task_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> tuple[str, Agent]:
        """
        Create a new browser-use Agent instance.
        
        Args:
            task: The task to perform
            llm_provider: The LLM provider to use
            headless: Whether to run in headless mode
            persistent_session: Whether to use a persistent session
            task_id: Optional task ID, will be generated if not provided
            metadata: Optional metadata to associate with the agent
            
        Returns:
            tuple: (task_id, agent)
        """
        # Generate task_id if not provided
        if not task_id:
            task_id = str(uuid.uuid4())
            
        # Get LLM provider strategy
        llm_strategy = LLMProviderFactory.get_provider(llm_provider)
        
        # Configure browser settings
        browser_config = BrowserConfig(
            headless=headless,
        )
        
        # Configure browser context settings
        context_config = BrowserContextConfig(
            highlight_elements=True,  # Highlight elements for better visibility
            wait_for_network_idle_page_load_time=3.0,  # Increase wait time for better reliability
            browser_window_size={'width': 1920, 'height': 1080},  # Set window size
        )
        
        # Create agent
        agent = Agent(
            task=task,
            llm=llm_strategy.get_llm(),
            # Pass browser configuration
            browser=None,  # Will be created by the Agent
            browser_context=None,  # Will be created by the Agent
            # Additional settings
            generate_gif=True,  # Generate GIF recordings
            save_conversation_path=os.path.join(os.getcwd(), "recordings", f"{task_id}.json"),
        )
        
        # Store agent
        self.active_agents[task_id] = agent
        
        return task_id, agent
    
    async def execute_task(self, task_id: str, agent: Agent) -> Dict[str, Any]:
        """
        Execute a task using the provided agent.
        
        Args:
            task_id: The task ID
            agent: The agent to use
            
        Returns:
            Dict: The result of the task execution
        """
        try:
            # Run the agent
            result = await agent.run()
            
            # Format the response
            response = {
                "task_id": task_id,
                "status": "completed",
                "result": result,
            }
            
            return response
        except Exception as e:
            logger.exception(f"Error executing task {task_id}: {str(e)}")
            return {
                "task_id": task_id,
                "status": "error",
                "error": str(e),
            }
    
    async def pause_task(self, task_id: str) -> Dict[str, Any]:
        """
        Pause a task.
        
        Args:
            task_id: The task ID
            
        Returns:
            Dict: The result of the pause operation
        """
        agent = self.get_agent_for_task(task_id)
        if not agent:
            return {"status": "error", "message": f"No agent found for task {task_id}"}
        
        try:
            await agent.pause()
            return {"status": "success", "message": f"Task {task_id} paused"}
        except Exception as e:
            logger.exception(f"Error pausing task {task_id}: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    async def resume_task(self, task_id: str) -> Dict[str, Any]:
        """
        Resume a task.
        
        Args:
            task_id: The task ID
            
        Returns:
            Dict: The result of the resume operation
        """
        agent = self.get_agent_for_task(task_id)
        if not agent:
            return {"status": "error", "message": f"No agent found for task {task_id}"}
        
        try:
            await agent.resume()
            return {"status": "success", "message": f"Task {task_id} resumed"}
        except Exception as e:
            logger.exception(f"Error resuming task {task_id}: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    async def cleanup_task(self, task_id: str) -> None:
        """
        Clean up resources for a task.
        
        Args:
            task_id: The task ID
        """
        agent = self.get_agent_for_task(task_id)
        if agent:
            # Remove from active agents
            del self.active_agents[task_id]
            
            # Additional cleanup if needed
            # Note: The browser-use Agent class handles browser cleanup automatically
            
    def get_task_status(self, task_id: str) -> Dict[str, Any]:
        """
        Get the status of a task.
        
        Args:
            task_id: The task ID
            
        Returns:
            Dict: The status of the task
        """
        agent = self.get_agent_for_task(task_id)
        if not agent:
            return {"status": "not_found", "message": f"No agent found for task {task_id}"}
        
        # Get agent status
        status = "running"
        if agent.is_paused:
            status = "paused"
        
        return {
            "task_id": task_id,
            "status": status,
        }

# Create a singleton instance
agent_adapter = AgentAdapter() 