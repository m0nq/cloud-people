import logging
import asyncio
import time
import json
from typing import Any, Callable, Coroutine

logger = logging.getLogger(__name__)

async def retry_operation(operation_name: str, func: Callable[..., Coroutine], *args, **kwargs) -> Any:
    """Retry an operation with exponential backoff."""
    max_retries = 3
    retry_delay = 1  # seconds
    
    for attempt in range(max_retries):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            if attempt < max_retries - 1:
                logger.warning(f"Attempt {attempt + 1} failed for {operation_name}: {str(e)}. Retrying in {retry_delay} seconds...")
                await asyncio.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
            else:
                logger.error(f"All {max_retries} attempts failed for {operation_name}: {str(e)}")
                raise

async def restore_state(page, paused_state):
    """Restore the browser state from a paused task."""
    if not paused_state:
        logger.warning("No paused state to restore")
        return
    
    logger.info("Restoring browser state")
    
    # Restore URL
    if paused_state.get('url'):
        logger.info(f"Navigating to URL: {paused_state['url']}")
        try:
            await retry_operation("navigate to URL", page.goto, paused_state['url'])
        except Exception as e:
            logger.error(f"Failed to navigate to URL {paused_state['url']}: {str(e)}")
            # Continue with other restoration steps even if navigation fails
    
    # Restore form inputs
    if paused_state.get('form_data'):
        logger.info("Restoring form data")
        for selector, value in paused_state['form_data']:
            try:
                # Wait for the element to be available
                await retry_operation(f"wait for element {selector}", page.wait_for_selector, selector, timeout=5000)
                
                # Get the element type
                element_type = await page.evaluate(f"document.querySelector('{selector}')?.type || ''")
                
                if element_type == 'checkbox' or element_type == 'radio':
                    if value:
                        await retry_operation(f"check {selector}", page.check, selector)
                    else:
                        await retry_operation(f"uncheck {selector}", page.uncheck, selector)
                elif element_type == 'select-one' or element_type == 'select-multiple':
                    await retry_operation(f"select option for {selector}", page.select_option, selector, value)
                else:  # Default to fill for text inputs, textareas, etc.
                    await retry_operation(f"fill {selector}", page.fill, selector, value)
                    
                # Trigger input and change events to notify listeners
                await page.evaluate(f"""
                    (() => {{  
                        const el = document.querySelector('{selector}');
                        if (el) {{
                            el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                            el.dispatchEvent(new Event('change', {{ bubbles: true }}));
                        }}
                    }})();
                """)
            except Exception as e:
                logger.warning(f"Error restoring form element {selector}: {str(e)}")
                # Continue with other form elements
    
    # Restore scroll position
    if paused_state.get('scroll_position'):
        logger.info("Restoring scroll position")
        try:
            x, y = paused_state['scroll_position']
            await retry_operation("restore scroll position", page.evaluate, f"window.scrollTo({x}, {y})")
        except Exception as e:
            logger.warning(f"Error restoring scroll position: {str(e)}")
    
    # Restore local storage
    if paused_state.get('local_storage'):
        logger.info("Restoring local storage")
        for key, value in paused_state['local_storage']:
            try:
                script = f"localStorage.setItem('{key}', {json.dumps(value)})"
                await retry_operation(f"set localStorage item {key}", page.evaluate, script)
            except Exception as e:
                logger.warning(f"Error restoring local storage item {key}: {str(e)}")
    
    # Restore session storage
    if paused_state.get('session_storage'):
        logger.info("Restoring session storage")
        for key, value in paused_state['session_storage']:
            try:
                script = f"sessionStorage.setItem('{key}', {json.dumps(value)})"
                await retry_operation(f"set sessionStorage item {key}", page.evaluate, script)
            except Exception as e:
                logger.warning(f"Error restoring session storage item {key}: {str(e)}")
    
    logger.info("Browser state restoration completed")
