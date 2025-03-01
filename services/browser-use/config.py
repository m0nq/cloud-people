import os
import logging
from typing import Dict, List, Optional, Any

# Configure logging
logger = logging.getLogger(__name__)

# Define supported LLM providers and their environment variables
LLM_PROVIDER_ENV_VARS = {
    "gemini": "GOOGLE_API_KEY",
    "openai": "OPENAI_API_KEY",
    "anthropic": "ANTHROPIC_API_KEY",
    "cohere": "COHERE_API_KEY",
    "azure_openai": "AZURE_OPENAI_API_KEY",
    # Add more providers as needed
}

# Define default models for each provider
DEFAULT_LLM_MODELS = {
    "gemini": "gemini-2.0-flash-exp",
    "openai": "gpt-4",
    "anthropic": "claude-3-opus-20240229",
    # "cohere": "command-r-plus",
    # "azure_openai": "gpt-4",
    # Add more defaults as needed
}

# Define supported browser tools
BROWSER_TOOLS = {
    "playwright": {
        "supported_browsers": ["chromium", "firefox", "webkit"],
        "default_browser": "chromium"
    },
    "selenium": {
        "supported_browsers": ["chrome", "firefox", "edge"],
        "default_browser": "chrome"
    },
    # Add more tools as needed
}

def get_available_llm_providers() -> List[str]:
    """Get a list of available LLM providers based on environment variables"""
    return [provider for provider, env_var in LLM_PROVIDER_ENV_VARS.items() 
            if os.getenv(env_var)]

def validate_llm_provider_config() -> None:
    """Validate that at least one LLM provider is configured"""
    available_providers = get_available_llm_providers()
    
    if not available_providers:
        # Generate a user-friendly error message with all possible options
        env_var_list = ", ".join([f"'{env}'" for env in LLM_PROVIDER_ENV_VARS.values()])
        raise ValueError(f"No LLM provider API keys found. At least one of these environment variables must be set: {env_var_list}")
    
    # Log available providers
    logger.info(f"Available LLM providers: {', '.join(available_providers)}")

def get_api_key_for_provider(provider: str) -> Optional[str]:
    """Get the API key for a specific provider"""
    if provider not in LLM_PROVIDER_ENV_VARS:
        return None
    
    return os.getenv(LLM_PROVIDER_ENV_VARS[provider])

def get_default_model_for_provider(provider: str) -> str:
    """Get the default model for a specific provider"""
    if not provider:
        return "gemini-2.0-flash-exp"  # Default fallback
    return DEFAULT_LLM_MODELS.get(provider.lower(), "gemini-2.0-flash-exp")

def get_default_provider() -> str:
    """Get the default provider (first available one)"""
    available_providers = get_available_llm_providers()
    if not available_providers:
        raise ValueError("No LLM providers available")
    
    return available_providers[0]

def get_browser_tool_config(tool_name: str) -> Dict[str, Any]:
    """Get configuration for a specific browser tool"""
    if tool_name not in BROWSER_TOOLS:
        raise ValueError(f"Unsupported browser tool: {tool_name}")
    
    return BROWSER_TOOLS[tool_name]

def get_supported_browser_tools() -> List[str]:
    """Get a list of supported browser tools"""
    return list(BROWSER_TOOLS.keys())

# Application-wide configuration
class AppConfig:
    """Application configuration"""
    # Default timeouts
    DEFAULT_OPERATION_TIMEOUT = 60  # seconds
    
    # Recording settings
    DEFAULT_RECORDING_FORMAT = "mp4"
    DEFAULT_RECORDING_QUALITY = "medium"
    DEFAULT_RECORDING_FRAME_RATE = 5
    
    # WebSocket settings
    WEBSOCKET_HEARTBEAT_INTERVAL = 30  # seconds