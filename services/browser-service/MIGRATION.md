# Browser Service Migration Plan

## Summary
This document outlines the plan for migrating the browser service from the legacy implementation to the new `browser-use` library. The migration is being performed in phases to ensure minimal disruption to existing functionality.

### Current Status
- ✅ **Phase 1**: Project Restructuring and Dependency Updates - **COMPLETED**
- ✅ **Phase 2**: API Endpoint Updates - **COMPLETED**
- 🔄 **Phase 3**: Testing and Validation - **IN PROGRESS**
- ⏳ **Phase 4**: Documentation and Deployment - **PENDING**

### Key Accomplishments
1. Successfully integrated the `AgentAdapter` class to interface with the `browser-use` library
2. Updated all API endpoints to use the new implementation:
   - Task execution endpoints (`/execute`)
   - Task management endpoints (`/tasks`, `/tasks/{task_id}/status`, `/tasks/{task_id}/pause`, `/tasks/{task_id}/resume`)
   - Assistance endpoints (`/tasks/{task_id}/assistance`, `/tasks/{task_id}/resolve`)
   - Utility endpoints (`/screenshot`, `/sessions`, `/sessions/{session_id}/close`)
3. Implemented proper resource management for agents and sessions
4. Updated the lifespan function to handle initialization and cleanup of the `AgentAdapter`
5. Enhanced the periodic cleanup function to manage stale agents and sessions

### Next Steps
1. Complete comprehensive testing of all migrated functionality
2. Validate performance and resource usage
3. Finalize documentation
4. Prepare for deployment

## Overview

This document outlines the steps to migrate our custom browser automation service to use the `browser-use` library. The migration will be done in phases to ensure minimal disruption to existing functionality while gaining the benefits of the library's advanced features.

## Phase 1: Project Restructuring and Dependency Updates ✅

### 1. ✅ Rename the service from `browser-agent-service` to `browser-service`
### 2. ✅ Update Docker configurations
### 3. ✅ Reorganize project structure
   - ✅ Move core components to `core/` directory
   - ✅ Organize strategies in `strategies/` directory
### 4. ✅ Update dependencies
   - ✅ Add `browser-use` library
   - ✅ Update other dependencies as needed
### 5. ✅ Core Component Migration
   - ✅ Implement `AgentAdapter` class to interface with `browser-use` library
   - ✅ Retain existing LLM strategy pattern

## Phase 2: API Endpoint Updates ✅

### 1. ✅ Update `/execute` endpoint to use `AgentAdapter` for task creation and execution
### 2. ✅ Adapt pause/resume endpoints to use `AgentAdapter`
   - ✅ `/execute/{task_id}/pause`
   - ✅ `/execute/{task_id}/resume`
### 3. ✅ Update `/execute/{task_id}` status endpoint to use `AgentAdapter`
### 4. ✅ Update assistance and resolve endpoints to use `AgentAdapter`
   - ✅ `/execute/{task_id}/assistance`
   - ✅ `/execute/{task_id}/resolve`
### 5. ✅ Update task listing endpoint
   - ✅ `/tasks`
### 6. ✅ Update utility endpoints
   - ✅ `/screenshot` - Take a screenshot using the browser-use library
   - ✅ `/sessions` - List active sessions from the AgentAdapter
   - ✅ `/sessions/{session_id}/close` - Close a session using the AgentAdapter

## Phase 3: Testing and Validation 🔄

### 1. 🔄 Develop comprehensive tests for the migrated service
   - ✅ Basic functionality tests for task execution
   - 🔄 Tests for pause/resume functionality
   - 🔄 Tests for assistance/resolve functionality
   - 🔄 Tests for session management
   - ⏳ Tests for error handling and recovery

### 2. 🔄 Validate functionality against the original service
   - ✅ Task execution validation
   - ✅ Task status tracking
   - 🔄 Session management validation
   - 🔄 Screenshot and recording functionality
   - ⏳ Error handling validation

### 3. 🔄 Performance testing and optimization
   - 🔄 Memory usage monitoring
   - 🔄 Response time benchmarking
   - ⏳ Concurrency testing
   - ⏳ Resource usage optimization

## Phase 4: Documentation and Deployment ⏳

### 1. ⏳ Update API documentation
### 2. ⏳ Create migration guide for clients
### 3. ⏳ Deploy to staging environment
### 4. ⏳ Monitor and address any issues
### 5. ⏳ Deploy to production

## Design Decisions

### Adapter Pattern

We've implemented the adapter pattern through the `AgentAdapter` class to provide a bridge between our service API and the `browser-use` library. This approach offers several benefits:

1. **Backward Compatibility**: Maintains the same API for clients while changing the underlying implementation
2. **Gradual Migration**: Allows us to migrate components incrementally without breaking existing functionality
3. **Isolation of Changes**: Confines changes to specific areas of the codebase, reducing the risk of regressions
4. **Simplified Testing**: Makes it easier to test the integration with the new library

### LLM Strategy Pattern

We've retained the existing LLM strategy pattern, which allows us to:

1. **Flexibility**: Switch between different LLM providers without changing the core logic
2. **Security**: Keep sensitive API keys and credentials isolated in provider-specific strategies
3. **Error Handling**: Implement provider-specific error handling and retry logic
4. **Future Extensibility**: Easily add support for new LLM providers as they become available

## Implementation Details

### Task Execution Flow

```python
# Create an agent using the adapter
task_id, agent = await agent_adapter.create_agent(
    task=task,
    llm_provider=llm_provider,
    headless=headless,
    persistent_session=persistent_session,
    metadata=metadata
)

# Execute the task
result = await agent_adapter.execute_task(task_id, agent)
```

### Pause/Resume Endpoints

```python
# Pause a task
result = await agent_adapter.pause_task(task_id)

# Resume a task
result = await agent_adapter.resume_task(task_id)
```

### Task Status Endpoint

```python
# Get task status from adapter if not found locally
agent_status = agent_adapter.get_task_status(task_id)
```

### Assistance and Resolve Endpoints

```python
# Check if task exists in our tracking or in the agent
if task_id not in active_tasks:
    # Try to get task status from agent
    agent_status = agent_adapter.get_task_status(task_id)
    if agent_status["status"] == "not_found":
        raise HTTPException(status_code=404, detail=f"Task with ID {task_id} not found")
    
    # Create a new TaskStatus object if task exists in agent but not in our tracking
    task_status = TaskStatus(
        task_id=task_id,
        status=agent_status["status"],
        metadata={"recovered_from_agent": True}
    )
    active_tasks[task_id] = task_status
```

### Task Listing Endpoint

```python
# Get tasks from our tracking
active = list(active_tasks.values())
history = list(task_history.values())

# Get task IDs we're already tracking
tracked_task_ids = set(active_tasks.keys()) | set(task_history.keys())

# Get all agents from the adapter
for task_id, agent in agent_adapter.active_agents.items():
    # Skip tasks we're already tracking
    if task_id in tracked_task_ids:
        continue
    
    # Get status from agent
    agent_status = agent_adapter.get_task_status(task_id)
    
    # Create a TaskStatus object for this agent
    if agent_status["status"] != "not_found":
        task_status = TaskStatus(
            task_id=task_id,
            status=agent_status["status"],
            metadata={"recovered_from_agent": True}
        )
        active.append(task_status)
```

### Screenshot Endpoint

```python
# Generate a temporary task ID for the screenshot
screenshot_task_id = f"screenshot_{str(uuid.uuid4())}"

# Create a temporary agent for the screenshot
task_id, agent = await agent_adapter.create_agent(
    task="Take a screenshot",
    llm_provider=get_default_provider(),
    headless=False,
    task_id=screenshot_task_id,
    metadata={"purpose": "screenshot"}
)

try:
    # Initialize the browser if not already initialized
    if not agent._browser:
        await agent._setup_browser()
    
    # Take screenshot using the browser context
    if agent._browser_context:
        page = await agent._browser_context.new_page()
        screenshot_bytes = await page.screenshot()
        await page.close()
        
        # Return as base64
        return {"screenshot": base64.b64encode(screenshot_bytes).decode('utf-8')}
finally:
    # Clean up the agent
    await agent_adapter.cleanup_task(task_id)
```

### Session Management

```python
# List sessions
sessions = []
session_ids = set()

# Collect session information from active agents
for task_id, agent in agent_adapter.active_agents.items():
    if hasattr(agent, '_context') and agent._context:
        session_id = getattr(agent._context, 'session_id', None)
        if session_id and session_id not in session_ids:
            session_ids.add(session_id)
            
            # Get metadata from the task if available
            metadata = {}
            if task_id in active_tasks and active_tasks[task_id].metadata:
                metadata = active_tasks[task_id].metadata
            
            sessions.append({
                "session_id": session_id,
                "persistent": getattr(agent._config, 'persistent_session', False),
                "last_activity": last_activity.isoformat(),
                "headless": getattr(agent, '_headless', True),
                "metadata": metadata
            })
```

## End-to-End Flow

### Frontend to Backend Flow

1. **Frontend Initialization**:
   - The `WorkingAgentLayout` component mounts in the UI
   - It initializes the `useAgent` hook with the agent ID

2. **Task Execution**:
   - When triggered, the `executeTask` function in `use-agent.ts` is called
   - The hook prepares the task request with agent data and sends it to the `/execute` endpoint

3. **Backend Processing**:
   - The `/execute` endpoint in `main.py` receives the request
   - It creates a task ID and initializes a `TaskStatus` object
   - The request is passed to the `AgentAdapter` which creates a `browser-use` Agent

4. **Task Execution**:
   - The `AgentAdapter` executes the task using the `browser-use` library
   - The browser automation runs in a headless or visible browser (configurable)
   - Status updates are broadcast to connected WebSocket clients

5. **Result Handling**:
   - When the task completes, the result is returned to the frontend
   - The frontend updates the UI with the task result or error

### Visual Monitoring

- **VNC Connection**: Yes, browser automation can be viewed through VNC when running in non-headless mode
- **Screenshots**: The service captures screenshots during execution which can be viewed via the API
- **Recordings**: GIF recordings of the automation are generated and can be accessed via the API

## Rollback Plan

### 1. Preparation
- [x] Maintain feature parity during migration
- [x] Keep custom implementation as fallback
- [x] Document state mapping between implementations

### 2. Rollback Steps
```bash
# If needed, revert to custom implementation:
git revert migration-commits
docker-compose up --build browser-service
```

## Timeline and Milestones

1. **Phase 1** (1-2 days) ✅
   - Basic setup and initial integration
   - Verify core functionality

2. **Phase 2** (2-3 days) ✅
   - API endpoint adaptation
   - Basic feature parity

3. **Phase 3** (3-4 days) 🔄
   - Advanced feature integration
   - Performance optimization

4. **Phase 4** (2-3 days) ⏳
   - Testing and validation
   - Performance benchmarking

5. **Phase 5** (1-2 days) ⏳
   - Documentation updates
   - Final cleanup

Total estimated time: 9-14 days

## Success Criteria

1. All existing functionality maintained
2. New features successfully integrated
3. Performance meets or exceeds current implementation
4. Test coverage maintained or improved
5. Documentation complete and up-to-date
6. No regression in error handling or reliability

## Notes

- Keep the migration atomic per phase
- Maintain backwards compatibility where possible
- Document all changes and new features
- Monitor performance metrics throughout migration
- Regular testing at each phase 