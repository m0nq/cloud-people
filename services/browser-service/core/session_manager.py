import logging
import asyncio
from typing import Dict, Optional, Any
from datetime import datetime, timedelta

from .context import BrowserUseContext

logger = logging.getLogger(__name__)

class SessionManager:
    """Manager for browser sessions"""
    
    def __init__(self, session_timeout_minutes: int = 30):
        self.sessions: Dict[str, BrowserUseContext] = {}
        self.session_timeout_minutes = session_timeout_minutes
        self.last_activity: Dict[str, datetime] = {}
        self._cleanup_task = None
    
    def start(self):
        """Start the session manager and its cleanup task"""
        if not self._cleanup_task:
            self._cleanup_task = asyncio.create_task(self._cleanup_old_sessions())
            logger.info(f"Session manager started with timeout of {self.session_timeout_minutes} minutes")
    
    async def stop(self):
        """Stop the session manager and clean up all sessions"""
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
            self._cleanup_task = None
        
        # Clean up all sessions
        session_ids = list(self.sessions.keys())
        for session_id in session_ids:
            await self.close_session(session_id, force=True)
        
        logger.info("Session manager stopped and all sessions cleaned up")
    
    def get_session(self, session_id: str) -> Optional[BrowserUseContext]:
        """Get a session by ID"""
        if session_id in self.sessions:
            # Update last activity time
            self.last_activity[session_id] = datetime.now()
            return self.sessions[session_id]
        return None
    
    def add_session(self, context: BrowserUseContext):
        """Add a session to the manager"""
        self.sessions[context.session_id] = context
        self.last_activity[context.session_id] = datetime.now()
        logger.info(f"Added session {context.session_id} to session manager")
    
    async def close_session(self, session_id: str, force: bool = False):
        """Close a session by ID"""
        if session_id in self.sessions:
            context = self.sessions[session_id]
            await context._cleanup(force=force)
            
            # Only remove from sessions if we're forcing cleanup or the session is not persistent
            if force or not context.persistent:
                del self.sessions[session_id]
                if session_id in self.last_activity:
                    del self.last_activity[session_id]
                logger.info(f"Removed session {session_id} from session manager")
    
    async def _cleanup_old_sessions(self):
        """Periodically clean up old sessions"""
        try:
            while True:
                await asyncio.sleep(60)  # Check every minute
                
                now = datetime.now()
                session_ids = list(self.last_activity.keys())
                
                for session_id in session_ids:
                    last_active = self.last_activity[session_id]
                    if now - last_active > timedelta(minutes=self.session_timeout_minutes):
                        logger.info(f"Session {session_id} has been inactive for {self.session_timeout_minutes} minutes, cleaning up")
                        await self.close_session(session_id, force=True)
        except asyncio.CancelledError:
            logger.info("Session cleanup task cancelled")
            raise
        except Exception as e:
            logger.error(f"Error in session cleanup task: {str(e)}") 