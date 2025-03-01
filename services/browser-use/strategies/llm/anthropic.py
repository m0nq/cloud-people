import logging
from typing import Dict, Any, Optional

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
                
            # Generate response
            response = await self.llm.agenerate([prompt])
            return response.generations[0][0].text
        except Exception as e:
            logger.error(f"Error generating response with Anthropic: {str(e)}")
            raise
    
    def get_provider_name(self) -> str:
        return "Anthropic Claude"