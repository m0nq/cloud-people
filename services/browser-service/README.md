# Browser Use Service

A service for AI-driven browser automation.

## Features

- **AI-Powered Browser Automation**: Uses LLMs to generate and execute browser actions
- **Multiple LLM Providers**: Supports OpenAI, Anthropic, Google, and more
- **Browser Recording**: Captures browser sessions as videos or screenshots
- **Real-Time Monitoring**: WebSocket-based task monitoring
- **Containerized**: Packaged with all necessary dependencies
- **Browser Session Persistence**: Maintains browser state between tasks

## Browser Session Persistence

The Browser Use service supports persistent browser sessions between tasks, allowing subsequent tasks to build upon previous work without starting a fresh browser each time a new task comes in.

### How It Works

1. When a task is executed with `persistent_session: true`, the browser session is kept open after the task completes.
2. Subsequent tasks can reuse the same session by providing the same `task_id`.
3. The session will be automatically closed after a period of inactivity (default: 30 minutes).

### Configuration

- `SESSION_TIMEOUT_MINUTES`: Environment variable to set the timeout for inactive sessions (default: 30 minutes).

### Usage in Workflows

In a workflow context, browser sessions are automatically persisted between connected agent nodes. When an agent node has outgoing connections (children), the browser session is kept open for the next node to use. The last node in a workflow chain will automatically close the session.

### Error Handling

If a task fails, the browser session is automatically closed to prevent resource leaks.

## API Endpoints

### POST /execute

Execute a browser task with the following request body:

```json
{
  "task": "Navigate to example.com and extract the main heading",
  "task_id": "optional-custom-id",
  "persistent_session": true,
  "operation_timeout": 60,
  "recording_config": {
    "enabled": true,
    "format": "mp4",
    "quality": "medium",
    "frame_rate": 5
  },
  "llm_provider": {
    "type": "openai",
    "model": "gpt-4",
    "temperature": 0.7
  },
  "headless": false
}
```

### GET /sessions

Get a list of all active browser sessions.

### POST /sessions/{session_id}/close

Explicitly close a browser session.

### WebSocket /ws/{client_id}

WebSocket endpoint for real-time task updates.

## Installation

### Using Docker

```bash
# Build and run with Docker
docker build -t browser-use .
docker run -p 8000:8000 -e OPENAI_API_KEY=your_key_here browser-use
```

### Manual Installation

```bash
# Clone the repository
git clone <repository-url>
cd browser-use

# Install dependencies
pip install -r requirements.txt

# Run the service
python main.py
```

## Environment Variables

```
# LLM Provider API Keys
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_API_KEY=your_google_api_key

# Session Configuration
SESSION_TIMEOUT_MINUTES=30  # Default: 30 minutes

# Browser Configuration
RESOLUTION_WIDTH=1920
RESOLUTION_HEIGHT=1080
PLAYWRIGHT_BROWSERS_PATH=/home/pwuser/.cache/ms-playwright
DISPLAY=:99
VNC_PASSWORD=secret_password
```

## Monitoring

The service provides real-time monitoring of tasks through WebSockets. Connect to the `/ws/{client_id}` endpoint to receive updates on task status.

## Security Considerations

- The service is designed to run in a containerized environment
- API keys are passed securely through environment variables
- Browser sessions are isolated and cleaned up after use
- Session persistence is managed with timeouts to prevent resource leaks
