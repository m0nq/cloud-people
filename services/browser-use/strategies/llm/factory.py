from typing import Dict, Any

from ..base import LLMProviderStrategy
from .gemini import GeminiLLMStrategy
from .openai import OpenAILLMStrategy
from .anthropic import AnthropicLLMStrategy

class LLMProviderFactory:
    """Factory for creating LLM provider strategies"""
    
    @staticmethod
    def create_provider(provider_type: str, config: Dict[str, Any]) -> LLMProviderStrategy:
        """Create an LLM provider strategy based on type"""
        # Ensure we have default values for missing config items
        api_key = config.get("api_key")
        if not api_key:
            raise ValueError(f"API key is required for provider {provider_type}")
            
        # Get model with fallback to provider-specific default
        model = config.get("model")
        temperature = config.get("temperature", 0.7)
        
        if provider_type.lower() == "gemini":
            return GeminiLLMStrategy(
                api_key=api_key,
                model=model or "gemini-2.0-flash-exp",
                temperature=temperature
            )
        elif provider_type.lower() == "openai":
            return OpenAILLMStrategy(
                api_key=api_key,
                model=model or "gpt-4",
                temperature=temperature
            )
        elif provider_type.lower() == "anthropic":
            return AnthropicLLMStrategy(
                api_key=api_key,
                model=model or "claude-3-opus-20240229",
                temperature=temperature
            )
        else:
            raise ValueError(f"Unsupported LLM provider type: {provider_type}")