from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

class ActionType(str, Enum):
    """Types of browser actions that can be executed"""
    NAVIGATE = "navigate"
    CLICK = "click"
    TYPE = "type"
    GET_TEXT = "get_text"
    WAIT = "wait"
    SCREENSHOT = "screenshot"
    SCROLL = "scroll"
    SELECT = "select"
    HOVER = "hover"
    PRESS_KEY = "press_key"

class BrowserAction(BaseModel):
    """Model representing a browser action"""
    type: ActionType
    params: Dict[str, Any] = Field(default_factory=dict)
    description: Optional[str] = None

class ActionResult(BaseModel):
    """Model representing the result of a browser action"""
    success: bool = False
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)

class TaskResult(BaseModel):
    """Model representing the result of a browser task"""
    task: str
    actions_executed: List[Dict[str, Any]] = Field(default_factory=list)
    final_screenshot: Optional[str] = None
    success: bool = False
    message: str = ""
    error: Optional[str] = None
    start_time: datetime = Field(default_factory=datetime.now)
    end_time: Optional[datetime] = None
    
    def calculate_duration(self) -> float:
        """Calculate the duration of the task in seconds"""
        if not self.end_time:
            return 0.0
        return (self.end_time - self.start_time).total_seconds()

class RecordingConfig(BaseModel):
    """Model representing recording configuration"""
    enabled: bool = True
    format: str = "mp4"
    quality: str = "medium"
    frame_rate: int = 5
    width: int = 1920
    height: int = 1080