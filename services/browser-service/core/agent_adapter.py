"""
Agent Adapter for browser-use library integration.

This module provides an adapter between our service API and the browser-use library's Agent class.
It handles the conversion between our request/response formats and the browser-use library's API.
"""

import logging
import os
import uuid
from typing import Any, Dict, Optional
import asyncio

from browser_use import Agent
from browser_use import BrowserConfig
from browser_use import BrowserContextConfig

from strategies.llm.factory import LLMProviderFactory
from core.state_utils import restore_state

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
        
        # Add is_paused attribute to the agent
        agent.is_paused = False
        
        # Store agent
        self.active_agents[task_id] = agent
        
        return task_id, agent
    
    async def execute_task(
        self,
        task: str,
        task_id: str,
        headless: bool = True,
        llm_provider = None,
        operation_timeout: int = 300,
        options: Optional[Dict[str, Any]] = None,
        previous_output: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Execute a task using the browser-use library.
        
        Args:
            task: The task description
            task_id: The task ID
            headless: Whether to run in headless mode
            llm_provider: The LLM provider configuration
            operation_timeout: Timeout for the operation in seconds
            options: Additional options for the task
            previous_output: Output from a previous agent task
            
        Returns:
            Dict: The result of the task execution
        """
        try:
            # Check if we're resuming from a saved state
            resuming = False
            resume_data = None
            
            if options and "resume_from" in options:
                resuming = True
                resume_data = options["resume_from"]
                logger.info(f"Resuming task {task_id} from URL: {resume_data.get('url')}")
            
            # Get LLM provider strategy
            provider_type = llm_provider.type if llm_provider and hasattr(llm_provider, 'type') else "gemini"
            llm_strategy = LLMProviderFactory.get_provider(provider_type)
            
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
            
            # Configure browser context with previous output
            if previous_output:
                context_config.storage_state = {
                    "previous_output": previous_output if previous_output else {}
                }
            
            # Create agent
            agent = Agent(
                task=task,
                llm=llm_strategy.get_llm(),
                # Pass browser configuration
                browser=None,  # Will be created by the Agent
                browser_context=None,  # Will be created by the Agent
                browser_context_config=context_config,  # Pass context config
                # Additional settings
                generate_gif=True,  # Generate GIF recordings
                save_conversation_path=os.path.join(os.getcwd(), "recordings", f"{task_id}.json"),
            )
            
            # Add custom function to access previous output if available
            if previous_output:
                agent.add_function(
                    "get_previous_agent_output",
                    lambda: previous_output['data'] if 'data' in previous_output else {}
                )
                logger.info(f"Added get_previous_agent_output function for task {task_id}")
            
            # Add is_paused attribute to the agent
            agent.is_paused = False
            
            # Store agent
            self.active_agents[task_id] = agent
            
            # If resuming, navigate to the saved URL first and restore state
            if resuming and resume_data:
                # Initialize the browser if not already initialized
                if not agent.browser:
                    await agent.init_browser()
                
                # Use the restore_state helper function to restore all browser state
                # with retry mechanism and improved error handling
                try:
                    # Ensure we have a page to work with
                    if not hasattr(agent, 'page') or not agent.page:
                        # If agent doesn't have a page attribute, we need to access it through the browser context
                        if agent.browser and agent.browser_context:
                            pages = await agent.browser_context.pages()
                            page = pages[0] if pages else await agent.browser_context.new_page()
                            # Store the page reference for future use
                            agent.page = page
                        else:
                            logger.error(f"Browser or browser context not initialized for task {task_id}")
                            raise Exception("Browser not properly initialized")
                    
                    restoration_success = await restore_state(agent.page, resume_data)
                except Exception as e:
                    logger.error(f"Error accessing or restoring page for task {task_id}: {str(e)}")
                    restoration_success = False
                
                # If we have saved memory, restore it
                if resume_data.get('task_memory'):
                    agent.task_memory.history = resume_data.get('task_memory', [])
                
                # Log restoration status
                if restoration_success:
                    logger.info(f"Successfully restored state for task {task_id}")
                else:
                    logger.warning(f"State restoration had some issues for task {task_id}, but continuing execution")
            
            # Run the agent
            result = await agent.run()
            
            # Format the response
            response = {
                "status": "success",
                "result": result,
            }
            
            # Clean up resources
            await self.cleanup_task(task_id)
            
            return response
        except Exception as e:
            logger.exception(f"Error executing task {task_id}: {str(e)}")
            
            # Clean up resources
            await self.cleanup_task(task_id)
            
            return {
                "status": "error",
                "message": str(e),
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
            # Set the is_paused attribute instead of calling pause()
            agent.is_paused = True
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
            # Set the is_paused attribute to False instead of calling resume()
            agent.is_paused = False
            return {"status": "success", "message": f"Task {task_id} resumed"}
        except Exception as e:
            logger.exception(f"Error resuming task {task_id}: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    async def cancel_task(self, task_id: str) -> Dict[str, Any]:
        """
        Cancel a task.
        
        Args:
            task_id: The task ID
            
        Returns:
            Dict: The result of the cancel operation
        """
        agent = self.get_agent_for_task(task_id)
        if not agent:
            return {"status": "error", "message": f"No agent found for task {task_id}"}
        
        try:
            # Close the browser if it's open
            if hasattr(agent, 'browser') and agent.browser:
                await agent.browser.close()
            
            # Clean up the agent
            await self.cleanup_task(task_id)
            
            return {"status": "success", "message": f"Task {task_id} cancelled"}
        except Exception as e:
            logger.exception(f"Error cancelling task {task_id}: {str(e)}")
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
        if agent.state.paused:
            status = "paused"
        
        return {
            "task_id": task_id,
            "status": status,
        }

# Create a singleton instance
agent_adapter = AgentAdapter() 