import logging
from typing import Dict, Any, Optional

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
                temperature=temperature
            )
            logger.info(f"Successfully initialized Gemini LLM with model {model}")
        except Exception as e:
            logger.error(f"Error initializing Gemini LLM: {str(e)}")
            raise
    
    async def generate_response(self, prompt: str, options: Optional[Dict[str, Any]] = None) -> str:
        """Generate a response using Gemini"""
        try:
            # Apply any additional options if provided
            if options:
                # Handle specific options for Gemini
                pass
                
            # Generate response
            logger.debug(f"Generating response for prompt: {prompt[:50]}...")
            
            # Use a proper chat format
            from langchain_core.messages import HumanMessage
            
            # Create a HumanMessage with the prompt
            messages = [HumanMessage(content=prompt)]
            
            # Generate response
            response = await self.llm.agenerate([messages])
            logger.debug("Successfully generated response")
            
            # Extract the text from the response
            if response and response.generations and response.generations[0]:
                result = response.generations[0][0].text
                logger.debug(f"Response text: {result[:100]}...")
                return result
            else:
                logger.error("Empty response from Gemini")
                return "No response generated"
                
        except Exception as e:
            logger.error(f"Error generating response with Gemini: {str(e)}")
            raise
    
    def get_provider_name(self) -> str:
        return "Google Gemini"