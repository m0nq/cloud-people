# Browser Use Service

A microservice for browser automation using Playwright with non-headless browser support. This service allows you to execute browser tasks via API endpoints and monitor the execution through VNC or noVNC.

## Features

- Direct Playwright integration for browser automation
- Non-headless browser execution with visual monitoring capabilities
- Multiple LLM provider support (OpenAI, Anthropic, Google Gemini)
- Screenshot and video recording capabilities
- WebSocket-based task monitoring
- Containerized with all necessary dependencies

## Architecture

The service uses a simplified architecture:
- `BrowserUseContext`: Core class that manages browser lifecycle and task execution
- LLM Provider Strategies: Interchangeable LLM providers for generating browser actions
- FastAPI endpoints: REST API for task execution and monitoring

## API Endpoints

### POST /tasks
Execute a browser task with the following request body:
```json
{
  "task": "Navigate to example.com and extract the main heading",
  "task_id": "optional-custom-id",
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

### GET /tasks/{task_id}
Get the status and results of a specific task.

### GET /tasks
Get a list of all active and historical tasks.

### POST /screenshot
Take a screenshot of the current browser state.

### GET /providers
Get a list of available LLM providers.

### GET /health
Health check endpoint.

### WebSocket /ws/{client_id}
WebSocket endpoint for real-time task updates.

## Environment Variables

- `OPENAI_API_KEY`: API key for OpenAI
- `ANTHROPIC_API_KEY`: API key for Anthropic
- `GOOGLE_API_KEY`: API key for Google Gemini
- `DISPLAY`: X11 display configuration (default: ":99")
- `RESOLUTION_WIDTH`: Browser window width (default: "1920")
- `RESOLUTION_HEIGHT`: Browser window height (default: "1080")
- `PLAYWRIGHT_BROWSERS_PATH`: Path to Playwright browsers (default: "/home/pwuser/.cache/ms-playwright")
- `VNC_PASSWORD`: Password for VNC access (default: "vncpassword")

## Monitoring

The service provides multiple ways to monitor browser execution:
- VNC: Connect to port 5901 with a VNC client
- noVNC: Access the browser via web browser at port 6080
- WebSocket: Real-time task status updates

## Development

1. Build the container:
```bash
docker build -t browser-use-service .
```

2. Run the service:
```bash
docker run -p 8000:8000 -p 6080:6080 -p 5901:5901 \
  -e OPENAI_API_KEY=your_api_key \
  browser-use-service
```

3. Test the API:
```bash
curl -X POST http://localhost:8000/tasks \
  -H "Content-Type: application/json" \
  -d '{"task": "Navigate to example.com and extract the main heading"}'
```

4. Monitor execution:
- Open http://localhost:6080 in your browser to access noVNC
- Or connect to localhost:5901 with a VNC client

## Security Considerations

- The service runs as a non-root user (pwuser)
- Browser is isolated within the container
- API keys should be provided via environment variables, not hardcoded
