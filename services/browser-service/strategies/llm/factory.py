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
    
    @staticmethod
    def get_provider(provider_type: str) -> LLMProviderStrategy:
        """
        Get an LLM provider strategy based on type, using environment variables for configuration.
        
        This is a convenience method that loads configuration from environment variables.
        """
        import os
        
        # Determine which environment variable to use based on provider type
        if provider_type.lower() == "gemini":
            api_key = os.getenv("GOOGLE_API_KEY") # Use GOOGLE_API_KEY consistent with config.py
            model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")
        elif provider_type.lower() == "openai":
            api_key = os.getenv("OPENAI_API_KEY")
            model = os.getenv("OPENAI_MODEL", "gpt-4")
        elif provider_type.lower() == "anthropic":
            api_key = os.getenv("ANTHROPIC_API_KEY")
            model = os.getenv("ANTHROPIC_MODEL", "claude-3-opus-20240229")
        else:
            raise ValueError(f"Unsupported LLM provider type: {provider_type}")
            
        if not api_key:
            raise ValueError(f"API key environment variable not set for provider {provider_type}")
            
        # Get temperature from environment or use default
        temperature = float(os.getenv("LLM_TEMPERATURE", "0.7"))
        
        # Create provider with the configuration
        config = {
            "api_key": api_key,
            "model": model,
            "temperature": temperature
        }
        
        return LLMProviderFactory.create_provider(provider_type, config)