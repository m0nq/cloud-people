import logging
from typing import Dict, Any, Optional, List

from ..base import LLMProviderStrategy

logger = logging.getLogger(__name__)

class AnthropicLLMStrategy(LLMProviderStrategy):
    """Anthropic LLM implementation"""
    
    def __init__(self, api_key: str, model: str = "claude-3-opus-20240229", temperature: float = 0.7):
        from langchain_anthropic import ChatAnthropic
        self.llm = ChatAnthropic(
            model=model,
            api_key=api_key,
            temperature=temperature
        )
        logger.info(f"Initialized Anthropic LLM with model {model}")
    
    async def generate_response(self, prompt: str, options: Optional[Dict[str, Any]] = None) -> str:
        """Generate a response using Anthropic"""
        try:
            # Apply any additional options if provided
            if options:
                # Handle specific options for Anthropic
                if "max_tokens" in options:
                    self.llm.max_tokens = options["max_tokens"]
                if "top_k" in options:
                    self.llm.top_k = options["top_k"]
                if "top_p" in options:
                    self.llm.top_p = options["top_p"]
                if "temperature" in options:
                    self.llm.temperature = options["temperature"]
            
            # Import necessary message types
            from langchain_core.messages import HumanMessage, SystemMessage
            
            # Determine if this is a browser automation prompt
            is_browser_automation = "browser actions" in prompt.lower() or "browser task" in prompt.lower()
            
            # Create appropriate messages based on prompt type
            messages = []
            
            if is_browser_automation:
                # Add a system message for browser automation tasks
                system_prompt = """You are a browser automation expert. Your task is to generate a precise sequence of browser actions to accomplish the user's task.
                
                Return your response in valid JSON format with an array of actions. Each action should have a 'type' and 'params' object.
                
                Supported action types:
                - navigate: Go to a URL (params: url)
                - click: Click on an element (params: selector)
                - type: Type text into an input field (params: selector, text)
                - screenshot: Take a screenshot (params: name)
                - wait: Wait for an element or time (params: selector or timeout in ms)
                - scroll: Scroll the page (params: x, y or selector)
                - press_key: Press a keyboard key (params: key, selector optional)
                - select_option: Select an option from a dropdown (params: selector, value)
                - hover: Hover over an element (params: selector)
                - get_text: Get text from an element (params: selector)
                
                Example response format:
                ```json
                [
                  {
                    "type": "navigate",
                    "params": {
                      "url": "https://example.com"
                    }
                  },
                  {
                    "type": "click",
                    "params": {
                      "selector": "button.submit"
                    }
                  }
                ]
                ```
                
                Be precise with your selectors. Use CSS selectors that are specific enough to identify the element uniquely.
                Think step by step and include all necessary actions to complete the task successfully.
                """
                messages.append(SystemMessage(content=system_prompt))
                messages.append(HumanMessage(content=prompt))
                
                # Generate response
                logger.debug(f"Generating browser automation response with system prompt")
                response = await self.llm.agenerate([messages])
                
                # Extract the text from the response
                result = response.generations[0][0].text
                
                # Clean up JSON response if needed
                if "```json" in result:
                    # Extract JSON from code blocks
                    import re
                    json_match = re.search(r'```json\s*([\s\S]*?)\s*```', result)
                    if json_match:
                        result = json_match.group(1).strip()
                        logger.debug("Extracted JSON from code block")
                
                return result
            else:
                # For non-browser tasks, just use the prompt directly
                return (await self.llm.agenerate([[HumanMessage(content=prompt)]])).generations[0][0].text
                
        except Exception as e:
            logger.error(f"Error generating response with Anthropic: {str(e)}")
            raise
    
    def get_provider_name(self) -> str:
        return "Anthropic Claude"