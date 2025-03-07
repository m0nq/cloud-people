import logging
from typing import Dict, Any, Optional, List

from ..base import LLMProviderStrategy

logger = logging.getLogger(__name__)

class GeminiLLMStrategy(LLMProviderStrategy):
    """Google Gemini LLM implementation"""
    
    def __init__(self, api_key: str, model: str = "gemini-2.0-flash-exp", temperature: float = 0.7):
        from langchain_google_genai import ChatGoogleGenerativeAI
        
        logger.debug(f"Initializing Gemini LLM with model={model}, temperature={temperature}")
        logger.debug(f"API key present: {bool(api_key)}")
        
        # Ensure model is not None
        if model is None:
            model = "gemini-2.0-flash-exp"
            logger.warning("Model was None, using default model: gemini-2.0-flash-exp")
        
        # Ensure model is a string
        model = str(model)
        logger.debug(f"Final model value: {model} (type: {type(model)})")
            
        try:
            self.llm = ChatGoogleGenerativeAI(
                model=model,
                api_key=api_key,
                temperature=temperature,
            )
            logger.info(f"Successfully initialized Gemini LLM with model {model}")
        except Exception as e:
            logger.error(f"Error initializing Gemini LLM: {str(e)}")
            raise
    
    async def generate_response(self, prompt: str, options: Optional[Dict[str, Any]] = None) -> str:
        """Generate a response using Gemini"""
        try:
            # Apply any additional options if provided
            temperature = options.get("temperature", 0.7) if options else 0.7
            
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
            
            # Add the user's prompt as a human message
            messages.append(HumanMessage(content=prompt))
            
            # Generate response with potentially adjusted temperature
            if temperature != 0.7:
                self.llm.temperature = temperature
                
            logger.debug(f"Generating response with {len(messages)} messages")
            response = await self.llm.agenerate([messages])
            logger.debug("Successfully generated response")
            
            # Extract the text from the response
            if response and response.generations and response.generations[0]:
                result = response.generations[0][0].text
                logger.debug(f"Response text (first 100 chars): {result[:100]}...")
                
                # Clean up JSON response if needed
                if is_browser_automation and "```json" in result:
                    # Extract JSON from code blocks
                    import re
                    json_match = re.search(r'```json\s*([\s\S]*?)\s*```', result)
                    if json_match:
                        result = json_match.group(1).strip()
                        logger.debug("Extracted JSON from code block")
                
                return result
            else:
                logger.error("Empty response from Gemini")
                return "No response generated"
                
        except Exception as e:
            logger.error(f"Error generating response with Gemini: {str(e)}")
            raise
    
    def get_provider_name(self) -> str:
        """Get the name of the provider"""
        return "gemini"
        
    def get_llm(self) -> Any:
        """
        Get the underlying LLM object.
        
        Returns the ChatGoogleGenerativeAI instance that can be used by the browser-use library.
        """
        return self.llm