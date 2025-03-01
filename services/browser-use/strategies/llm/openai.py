import logging
from typing import Dict, Any, Optional

from ..base import LLMProviderStrategy

logger = logging.getLogger(__name__)

class OpenAILLMStrategy(LLMProviderStrategy):
    """OpenAI LLM implementation"""
    
    def __init__(self, api_key: str, model: str = "gpt-4", temperature: float = 0.7):
        from langchain_openai import ChatOpenAI
        self.llm = ChatOpenAI(
            model=model,
            api_key=api_key,
            temperature=temperature
        )
        logger.info(f"Initialized OpenAI LLM with model {model}")
    
    async def generate_response(self, prompt: str, options: Optional[Dict[str, Any]] = None) -> str:
        """Generate a response using OpenAI"""
        try:
            # Apply any additional options if provided
            if options:
                # Handle specific options for OpenAI
                if "max_tokens" in options:
                    self.llm.max_tokens = options["max_tokens"]
                if "top_p" in options:
                    self.llm.top_p = options["top_p"]
                if "presence_penalty" in options:
                    self.llm.presence_penalty = options["presence_penalty"]
                if "frequency_penalty" in options:
                    self.llm.frequency_penalty = options["frequency_penalty"]
                
            # Generate response
            response = await self.llm.agenerate([prompt])
            return response.generations[0][0].text
        except Exception as e:
            logger.error(f"Error generating response with OpenAI: {str(e)}")
            raise
    
    def get_provider_name(self) -> str:
        return "OpenAI"