# Browser Use Service

This service provides a containerized version of the [browser-use](https://github.com/browser-use/browser-use) library, exposed via a FastAPI endpoint.

## Features

- Runs browser-use in a Docker container with all necessary dependencies
- Exposes functionality via a REST API
- Includes Playwright with Chromium browser
- Health check endpoint for container orchestration

## API Endpoints

### POST /execute
Execute a browser task with the following request body:
```json
{
  "url": "https://example.com",
  "task": "Extract main content",
  "options": {
    // Optional browser-use configuration
  }
}
```

### GET /health
Health check endpoint that returns:
```json
{
  "status": "healthy"
}
```

## Environment Variables

- `DISPLAY`: X11 display configuration (default: ":99")
- `CHROME_PATH`: Path to Chrome binary
- `PYTHONUNBUFFERED`: Python output buffering (default: "1")

## Development

1. Build the container:
```bash
docker-compose build browser-use
```

2. Run the service:
```bash
docker-compose up browser-use
```

3. Test the API:
```bash
curl -X POST http://localhost:8000/execute \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "task": "Extract main content"}'
```
