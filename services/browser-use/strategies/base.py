from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List

class LLMProviderStrategy(ABC):
    """Abstract strategy for LLM providers"""
    
    @abstractmethod
    async def generate_response(self, prompt: str, options: Optional[Dict[str, Any]] = None) -> str:
        """Generate a response from the LLM"""
        pass
    
    @abstractmethod
    def get_provider_name(self) -> str:
        """Get the name of the provider"""
        pass