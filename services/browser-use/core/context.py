import logging
from typing import Dict, Any, Optional, List
import asyncio
import subprocess
import json
import re
import os
from datetime import datetime

from strategies.base import LLMProviderStrategy
from .visualization import BrowserVisualization

logger = logging.getLogger(__name__)

class BrowserUseContext:
    """Context for browser use operations"""
    
    def __init__(
        self,
        llm_provider: Optional[LLMProviderStrategy] = None,
        headless: Optional[bool] = False,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.llm_provider = llm_provider
        self.headless = headless
        self.metadata = metadata or {}
        self.browser = None
        self.page = None
        self.playwright = None
        self.recording_process = None
        self.screenshots_dir = os.path.join(os.getcwd(), "screenshots")
        self.recordings_dir = os.path.join(os.getcwd(), "recordings")
        os.makedirs(self.screenshots_dir, exist_ok=True)
        os.makedirs(self.recordings_dir, exist_ok=True)
        
        # Initialize visualization
        self.visualization = BrowserVisualization(
            screenshots_dir=self.screenshots_dir,
            recordings_dir=self.recordings_dir
        )
    
    async def _initialize_browser(self):
        """Initialize the browser if not already initialized"""
        if not self.browser:
            try:
                from playwright.async_api import async_playwright
                
                logger.info("Initializing Playwright browser")
                self.playwright = await async_playwright().start()
                
                # Launch browser with appropriate options
                self.browser = await self.playwright.chromium.launch(
                    headless=self.headless,
                    args=[
                        "--no-sandbox",
                        "--disable-setuid-sandbox",
                        "--disable-dev-shm-usage",
                        "--disable-accelerated-2d-canvas",
                        "--no-first-run",
                        "--no-zygote",
                        "--disable-gpu"
                    ]
                )
                
                # Create a new browser context with viewport settings
                context = await self.browser.new_context(
                    viewport={"width": 1280, "height": 800},
                    record_video_dir=os.path.join(os.getcwd(), "recordings") if not self.headless else None
                )
                
                # Create a new page
                self.page = await context.new_page()
                logger.info("Browser initialized successfully")
                
                return True
            except Exception as e:
                logger.error(f"Error initializing browser: {str(e)}")
                return False
        return True
    
    async def execute_task(self, task: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute a browser task using the configured strategies"""
        try:
            if not self.llm_provider:
                raise ValueError("LLM provider is not configured")
            
            # Initialize browser if needed
            browser_initialized = await self._initialize_browser()
            if not browser_initialized:
                return {
                    "success": False,
                    "error": "Failed to initialize browser"
                }
                
            # Generate browser actions from LLM
            prompt = f"Generate browser actions to accomplish the following task: {task}. Return a list of actions in JSON format with each action having 'type' and 'params' fields. Supported action types are: navigate, click, type, screenshot, wait, scroll, press_key, select_option, hover, and get_text."
            logger.debug(f"Sending prompt to LLM: {prompt}")
            
            try:
                actions_text = await self.llm_provider.generate_response(prompt, options)
                logger.debug(f"Received response from LLM: {actions_text[:100]}...")
                
                # Parse actions from LLM response
                actions = self._parse_actions(actions_text)
                
                if not actions:
                    return {
                        "task": task,
                        "llm_response": actions_text,
                        "actions_executed": [],
                        "success": False,
                        "error": "Failed to parse actions from LLM response"
                    }
                
                # Execute actions
                actions_executed = []
                for action in actions:
                    try:
                        result = await self._execute_action(action)
                        actions_executed.append({
                            "action": action,
                            "result": result
                        })
                    except Exception as e:
                        logger.error(f"Error executing action {action}: {str(e)}")
                        actions_executed.append({
                            "action": action,
                            "error": str(e)
                        })
                
                # Take a final screenshot
                screenshot_path = await self._take_screenshot("final")
                
                return {
                    "task": task,
                    "llm_response": actions_text,
                    "actions_executed": actions_executed,
                    "success": True,
                    "screenshot": screenshot_path,
                    "message": f"Executed {len(actions_executed)} actions"
                }
            except Exception as e:
                logger.error(f"Error generating LLM response: {str(e)}")
                return {
                    "task": task,
                    "success": False,
                    "error": str(e)
                }
        
        except Exception as e:
            logger.error(f"Error executing task: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _execute_action(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a single browser action"""
        action_type = action.get("type", "").lower()
        params = action.get("params", {})
        
        logger.info(f"Executing action: {action_type} with params: {params}")
        
        if action_type == "navigate":
            url = params.get("url", "")
            if not url:
                return {"success": False, "error": "URL not provided"}
            
            try:
                await self.page.goto(url, wait_until="domcontentloaded")
                return {"success": True, "url": url}
            except Exception as e:
                return {"success": False, "error": str(e)}
        
        elif action_type == "click":
            selector = params.get("selector", "")
            if not selector:
                return {"success": False, "error": "Selector not provided"}
            
            try:
                await self.page.click(selector)
                return {"success": True, "selector": selector}
            except Exception as e:
                return {"success": False, "error": str(e)}
        
        elif action_type == "type":
            selector = params.get("selector", "")
            text = params.get("text", "")
            
            if not selector:
                return {"success": False, "error": "Selector not provided"}
            
            try:
                await self.page.fill(selector, text)
                return {"success": True, "selector": selector, "text": text}
            except Exception as e:
                return {"success": False, "error": str(e)}
        
        elif action_type == "screenshot":
            name = params.get("name", "screenshot")
            path = await self._take_screenshot(name)
            return {"success": True, "path": path}
        
        elif action_type == "wait":
            timeout = params.get("timeout", 1000)
            try:
                await asyncio.sleep(timeout / 1000)
                return {"success": True, "timeout_ms": timeout}
            except Exception as e:
                return {"success": False, "error": str(e)}
        
        elif action_type == "scroll":
            selector = params.get("selector", "")
            x = params.get("x", 0)
            y = params.get("y", 0)
            
            try:
                if selector:
                    await self.page.evaluate(f"document.querySelector('{selector}').scrollBy({x}, {y})")
                else:
                    await self.page.evaluate(f"window.scrollBy({x}, {y})")
                return {"success": True, "x": x, "y": y}
            except Exception as e:
                return {"success": False, "error": str(e)}
        
        elif action_type == "press_key":
            key = params.get("key", "")
            selector = params.get("selector", "")
            
            if not key:
                return {"success": False, "error": "Key not provided"}
            
            try:
                if selector:
                    await self.page.press(selector, key)
                else:
                    await self.page.keyboard.press(key)
                return {"success": True, "key": key}
            except Exception as e:
                return {"success": False, "error": str(e)}
        
        elif action_type == "select_option":
            selector = params.get("selector", "")
            value = params.get("value", "")
            
            if not selector:
                return {"success": False, "error": "Selector not provided"}
            
            try:
                await self.page.select_option(selector, value)
                return {"success": True, "selector": selector, "value": value}
            except Exception as e:
                return {"success": False, "error": str(e)}
        
        elif action_type == "hover":
            selector = params.get("selector", "")
            
            if not selector:
                return {"success": False, "error": "Selector not provided"}
            
            try:
                await self.page.hover(selector)
                return {"success": True, "selector": selector}
            except Exception as e:
                return {"success": False, "error": str(e)}
        
        elif action_type == "get_text":
            selector = params.get("selector", "")
            
            if not selector:
                return {"success": False, "error": "Selector not provided"}
            
            try:
                text = await self.page.text_content(selector)
                return {"success": True, "selector": selector, "text": text}
            except Exception as e:
                return {"success": False, "error": str(e)}
        
        else:
            return {"success": False, "error": f"Unsupported action type: {action_type}"}
    
    def _parse_actions(self, actions_text: str) -> List[Dict[str, Any]]:
        """Parse actions from LLM response"""
        try:
            # Try to extract JSON from the response
            json_match = re.search(r'\[[\s\S]*\]', actions_text)
            if json_match:
                json_str = json_match.group(0)
                actions = json.loads(json_str)
                return actions
            
            # If no JSON found, try to parse structured text
            actions = []
            action_blocks = re.findall(r'Action\s*\d+:[\s\S]*?(?=Action\s*\d+:|$)', actions_text)
            
            if action_blocks:
                for block in action_blocks:
                    action_type_match = re.search(r'type:\s*"?([a-zA-Z_]+)"?', block, re.IGNORECASE)
                    if action_type_match:
                        action_type = action_type_match.group(1).lower()
                        params = {}
                        
                        # Extract parameters based on action type
                        if action_type == "navigate":
                            url_match = re.search(r'url:\s*"?(https?://[^"\s]+)"?', block, re.IGNORECASE)
                            if url_match:
                                params["url"] = url_match.group(1)
                        
                        elif action_type in ["click", "type", "hover", "get_text"]:
                            selector_match = re.search(r'selector:\s*"?([^"\n]+)"?', block, re.IGNORECASE)
                            if selector_match:
                                params["selector"] = selector_match.group(1).strip()
                            
                            if action_type == "type":
                                text_match = re.search(r'text:\s*"?([^"\n]+)"?', block, re.IGNORECASE)
                                if text_match:
                                    params["text"] = text_match.group(1).strip()
                        
                        actions.append({"type": action_type, "params": params})
            
            return actions
        except Exception as e:
            logger.error(f"Error parsing actions: {str(e)}")
            return []
    
    async def _take_screenshot(self, name: str = "screenshot") -> str:
        """Take a screenshot of the current page"""
        if not self.page:
            return ""
            
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{name}_{timestamp}.png"
        filepath = os.path.join(self.screenshots_dir, filename)
        
        try:
            await self.page.screenshot(path=filepath)
            # Update visualization with new screenshot
            self.visualization.update_current_screenshot(filepath)
            return filepath
        except Exception as e:
            logger.error(f"Error taking screenshot: {str(e)}")
            return ""
    
    def set_llm_provider(self, provider: LLMProviderStrategy):
        """Set the LLM provider"""
        self.llm_provider = provider
        
    async def start_recording(self, config: Dict[str, Any]) -> Optional[subprocess.Popen]:
        """Start recording the browser session"""
        if self.headless:
            logger.warning("Cannot record in headless mode")
            return None
        
        try:
            # Start recording using ffmpeg (requires ffmpeg to be installed)
            cmd = [
                "ffmpeg",
                "-f", "x11grab",
                "-video_size", "1280x800",
                "-i", os.environ.get("DISPLAY", ":0.0"),
                "-codec:v", "libx264",
                "-r", str(config.get("frame_rate", 15)),
                "-preset", "ultrafast",
                "-crf", "25",
                os.path.join(self.recordings_dir, f"recording_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4")
            ]
            
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            self.recording_process = process
            logger.info(f"Started recording to {self.recordings_dir}")
            
            return process
        except Exception as e:
            logger.error(f"Error starting recording: {str(e)}")
            return None
        
    async def stop_recording(self, process: Optional[subprocess.Popen] = None) -> Optional[str]:
        """Stop recording the browser session"""
        if not process and not self.recording_process:
            return None
        
        process_to_stop = process or self.recording_process
        
        try:
            # Send SIGTERM to ffmpeg
            process_to_stop.terminate()
            process_to_stop.wait(timeout=5)
            
            logger.info("Recording stopped")
            self.recording_process = None
            
            return "Recording stopped successfully"
        except Exception as e:
            logger.error(f"Error stopping recording: {str(e)}")
            return None
        
    async def _cleanup(self) -> None:
        """Clean up browser resources"""
        logger.info("Cleaning up browser resources")
        
        # Stop recording if active
        if self.recording_process:
            await self.stop_recording()
        
        # Close browser if it exists
        if self.browser:
            try:
                await self.browser.close()
                self.browser = None
                self.page = None
            except Exception as e:
                logger.error(f"Error closing browser: {str(e)}")
        
        # Close playwright if it exists
        if self.playwright:
            try:
                await self.playwright.stop()
                self.playwright = None
            except Exception as e:
                logger.error(f"Error stopping playwright: {str(e)}")