# Workflow Data Passing Analysis

## Current System Architecture

### Overview

The Cloud People project is a monorepo with a Next.js web app and a Python FastAPI server for browser automation. The system uses a workflow-based approach where multiple AI agents can be connected in a sequence, with each agent performing a specific task. The workflow execution is managed by the frontend, while the actual agent tasks are executed by the browser service.

### Key Components

1. **Frontend (Next.js)**
   - **Workflow Store**: Manages the workflow state, node transitions, and execution flow
   - **Agent Store**: Manages individual agent states and data
   - **Canvas Nodes**: Visual representation of agents in the workflow
   - **Agent Layouts**: Different UI states for agents (activating, working, complete)
   - **Use-Agent Hook**: Communication bridge between frontend and browser service

2. **Backend (Python FastAPI)**
   - **Browser Service**: Handles agent task execution using browser-use library
   - **Agent Adapter**: Manages agent instances and their lifecycle
   - **Session Manager**: Handles browser sessions and their persistence

### Current Workflow Execution Flow

1. User starts a workflow via the root node
2. `startWorkflow` transitions all nodes to Idle state and activates the first node
3. The activated agent node transitions to the Activating state and renders the activating layout
4. After a delay, the agent transitions to the Working state and renders the working layout
5. The working layout sends the agent description and data to the browser service
6. The browser service performs the task and sends status updates back to the frontend
7. When the task is complete, the agent transitions to the Complete state
8. `progressWorkflow` is called to activate the next agent in the sequence

## Current State of Data Passing Between Agents

### What's Working

1. **Workflow Execution Flow**: The system correctly manages the workflow execution flow, transitioning from one agent to the next.
2. **Agent State Management**: Individual agent states are properly managed and visualized.
3. **Browser Service Integration**: The browser service can execute tasks and report status back to the frontend.
4. **Pause/Resume Functionality**: The system has infrastructure for pausing and resuming workflows.

### What's Missing

1. **Data Passing Mechanism**: There is no explicit mechanism for passing data from one agent to the next.
2. **Result Storage**: Agent task results are not consistently stored or made available to subsequent agents.
3. **Context Persistence**: While the browser service has state saving capabilities, this state is not structured to be shared between agents.
4. **Task Chaining**: The system lacks a way to chain tasks where one agent's output becomes another agent's input.
5. **Error Handling**: No robust error handling for data passing failures between agents.
6. **Data Validation**: No schema validation for data passed between agents.
7. **Monitoring**: No telemetry to track data passing success rates.

## Implementation Requirements

To enable data passing between agents (like passing a Google Sheet URL from one agent to the next), we need to implement the following:

### 1. Frontend Changes

#### Agent Store Enhancements

```typescript
// Add result storage to agent state with proper typing
import { z } from 'zod';

// Define schema for agent results
export const AgentResultSchema = z.object({
  version: z.string(),
  timestamp: z.string(),
  data: z.unknown(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export type AgentResult = z.infer<typeof AgentResultSchema>;

// Add result storage to agent state
interface AgentStateData {
  state: AgentState;
  isEditable: boolean;
  isLoading: boolean;
  error: string | null;
  progress: number;
  assistanceMessage: string | null;
  // Add result storage with proper typing
  result: AgentResult | null;
}

// Create agent store with immutable updates
import { create } from 'zustand';

const useAgentStore = create((set, get) => ({
  // Existing state
  agentState: {} as Record<string, AgentStateData>,
  agentData: {} as Record<string, AgentData>,
  
  // Add methods to set and get agent results
  setAgentResult: (agentId: string, data: unknown) => {
    try {
      // Create a properly structured result
      const result: AgentResult = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data
      };
      
      // Validate result
      const validationResult = AgentResultSchema.safeParse(result);
      if (!validationResult.success) {
        console.error('Invalid agent result format:', validationResult.error);
        return;
      }
      
      // Update state immutably
      set((state) => {
        const currentAgentState = state.agentState[agentId] || { ...DEFAULT_AGENT_STATE };
        
        return {
          ...state,
          agentState: {
            ...state.agentState,
            [agentId]: {
              ...currentAgentState,
              result: validationResult.data
            }
          },
          agentResults: {
            ...state.agentResults,
            [agentId]: validationResult.data
          }
        };
      });
      
      console.log(`[DEBUG] Stored result for agent ${agentId}:`, result);
    } catch (error) {
      console.error(`[ERROR] Failed to set agent result for ${agentId}:`, error);
    }
  },
  
  getAgentResult: (agentId: string) => {
    const state = get();
    // First try to get from the dedicated results store
    const result = state.agentResults?.[agentId];
    if (result) return result;
    
    // Fall back to the result in agent state for backward compatibility
    const agentState = state.agentState[agentId];
    return agentState?.result || null;
  }
}));
```

#### Workflow Context Store

```typescript
// Add workflow context to store agent outputs with proper typing and immutability
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

// Define workflow context interface with versioning
interface WorkflowContext {
  version: string;
  data: {
    [agentId: string]: AgentResult;
  };
}

const useWorkflowStore = create((set, get) => ({
  // Existing state
  nodes: [],
  edges: [],
  workflowExecution: null,
  
  // Add workflow context
  workflowContext: {
    version: '1.0',
    data: {}
  } as WorkflowContext,
  
  // Add methods to update and access workflow context
  updateWorkflowContext: (agentId: string, result: AgentResult) => {
    set((state) => ({
      ...state,
      workflowContext: {
        ...state.workflowContext,
        data: {
          ...state.workflowContext.data,
          [agentId]: result
        }
      }
    }));
    
    // Track successful data passing
    console.log(`[Telemetry] Data passing update_context for ${agentId}: Success`);
  },
  
  getAgentContextData: (agentId: string) => {
    const { workflowContext } = get();
    return workflowContext.data[agentId] || null;
  },
  
  clearWorkflowContext: () => {
    set((state) => ({
      ...state,
      workflowContext: {
        version: '1.0',
        data: {}
      }
    }));
  }
}));
```

#### Use-Agent Hook Enhancements

```typescript
// Update executeTask to include previous agent's output with error handling and retries
const executeTask = async (previousAgentOutput?: AgentResult) => {
  // ... existing code
  
  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount < maxRetries) {
    try {
      setIsProcessing(true);
      setError(null);
      setResult(null);
      
      // Serialize previous output for transmission
      const serializedPreviousOutput = previousAgentOutput ? 
        JSON.stringify(previousAgentOutput) : undefined;
      
      // Include previous output in task execution
      const response = await fetch('/api/browser/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          task: agentData.description,
          task_id: taskId,
          options: {
            ...agentData.options,
            previousAgentOutput: serializedPreviousOutput
          }
        })
      });
      
      const responseData = await response.json();
      
      // Store result in agent state
      const { setAgentResult } = useAgentStore.getState();
      setAgentResult(agentData.id, responseData.result);
      
      // Track successful data passing
      trackDataPassingEvent(taskId, 'execute', true);
      
      return responseData;
    } catch (error) {
      retryCount++;
      console.error(`Error executing task (attempt ${retryCount}/${maxRetries}):`, error);
      
      // Track failed data passing
      trackDataPassingEvent(taskId, 'execute', false);
      
      if (retryCount >= maxRetries) {
        setError(error instanceof Error ? error.message : 'Unknown error');
        onStatusChange?.(AgentState.Error);
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
    } finally {
      setIsProcessing(false);
    }
  }
};

// Helper function for telemetry
const trackDataPassingEvent = (taskId: string, operation: string, success: boolean) => {
  // Implementation would depend on your analytics system
  console.log(`[Telemetry] Data passing ${operation} for ${taskId}: ${success ? 'Success' : 'Failure'}`);
};
```

### 2. Backend Changes

#### Browser Service Enhancements

```python
# Update TaskRequest model to include previous output with validation
from pydantic import BaseModel, Field, validator
from typing import Dict, Any, Optional

class TaskRequest(BaseModel):
    task: str
    task_id: Optional[str] = None
    operation_timeout: Optional[int] = DEFAULT_OPERATION_TIMEOUT
    recording_config: Optional[RecordingConfig] = None
    llm_provider: Optional[ProviderConfig] = None
    options: Optional[Dict[str, Any]] = None
    
    # Add field for previous agent output
    previous_agent_output: Optional[Dict[str, Any]] = None
    
    @validator('previous_agent_output')
    def validate_previous_output(cls, v):
        if v is not None:
            # Ensure it has the expected structure
            if not isinstance(v, dict):
                raise ValueError('Previous agent output must be a dictionary')
            if 'data' not in v:
                raise ValueError('Previous agent output must contain a data field')
        return v
```

#### Task Execution Function

```python
async def execute_task(
    task: str,
    task_id: str,
    headless: bool = True,
    llm_provider = None,
    operation_timeout: int = 300,
    options: Optional[Dict[str, Any]] = None,
    previous_output: Optional[Dict[str, Any]] = None  # Add previous output parameter
) -> Dict[str, Any]:
    """Execute a task using the browser-use library.
    
    Args:
        task: The task description
        task_id: The task ID
        headless: Whether to run in headless mode
        llm_provider: The LLM provider configuration
        operation_timeout: Timeout for the operation in seconds
        options: Additional options for the task
        previous_output: Output from a previous agent task
        
    Returns:
        Dict: The result of the task execution
    """
    try:
        # Get LLM provider strategy
        llm_strategy = LLMProviderFactory.get_provider(llm_provider)
        
        # Configure browser context with previous output
        context_config = BrowserContextConfig(
            storage_state={
                "previous_output": previous_output if previous_output else {}
            } if previous_output else None
        )
        
        # Create agent with task and context
        agent = Agent(
            task=task,
            llm_strategy=llm_strategy,
            headless=headless,
            browser_context_config=context_config,
            generate_gif=True,
            save_conversation_path=os.path.join(os.getcwd(), "recordings", f"{task_id}.json"),
        )
        
        # Add custom function to access previous output
        if previous_output:
            agent.add_function(
                "get_previous_agent_output",
                lambda: previous_output['data'] if 'data' in previous_output else {}
            )
        
        # Store agent
        AGENTS[task_id] = agent
        
        # Execute task with timeout
        try:
            result = await asyncio.wait_for(
                agent.execute(),
                timeout=operation_timeout
            )
            
            return {
                "status": "success",
                "task_id": task_id,
                "result": result
            }
        except asyncio.TimeoutError:
            return {
                "status": "error",
                "task_id": task_id,
                "error": f"Task execution timed out after {operation_timeout} seconds"
            }
        except Exception as e:
            return {
                "status": "error",
                "task_id": task_id,
                "error": str(e)
            }
    except Exception as e:
        return {
            "status": "error",
            "task_id": task_id,
            "error": str(e)
        }
```

### 3. Workflow Execution Enhancement

```typescript
// Update progressWorkflow to pass data between agents
const progressWorkflow = async (nodeId: string, status: AgentState) => {
  const { workflowExecution, nodes, edges } = get();
  
  if (!workflowExecution) {
    console.error('No active workflow execution');
    return;
  }
  
  try {
    if (status === AgentState.Complete) {
      // Get the completed agent's result
      const completedAgentId = nodeId;
      const completedAgentResult = useAgentStore.getState().getAgentResult(completedAgentId);
      
      // Store result in workflow context if available
      if (completedAgentResult) {
        get().updateWorkflowContext(completedAgentId, completedAgentResult);
      }
      
      // Check if this is the last node
      const nextNode = findNextNode(nodes, edges, nodeId);
      if (!nextNode) {
        // No next node, workflow is complete
        await updateWorkflowState(
          set,
          workflowExecution,
          WorkflowState.Completed,
          nodeId
        );
        return;
      }
      
      // Get the next agent ID
      const nextAgentId = nextNode.data.agentRef.agentId;
      
      // Pass the previous agent's result to the next agent
      if (completedAgentResult) {
        // Update the agent data to include the previous agent output
        const nextAgentData = useAgentStore.getState().getAgentData(nextAgentId);
        if (nextAgentData) {
          useAgentStore.getState().setAgentData(nextAgentId, {
            ...nextAgentData,
            previousAgentOutput: completedAgentResult
          });
          
          // Track successful data passing
          console.log(`[Telemetry] Data passing pass_to_next from ${completedAgentId} to ${nextAgentId}: Success`);
        }
      }
      
      // Start next node
      useAgentStore.getState().transition(nextNode.id, AgentState.Activating);
      transitionNode(set, nodes, nextNode.id, AgentState.Activating);
      
      // Update workflow state with next node
      await updateWorkflowState(
        set,
        workflowExecution,
        WorkflowState.Running,
        nextNode.id
      );
    }
  } catch (error) {
    console.error('Error in progressWorkflow:', error);
    
    // Update workflow state with error
    await updateWorkflowState(
      set,
      workflowExecution,
      WorkflowState.Paused,
      nodeId,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};

## Implementation Plan

### Phased Approach

1. **Phase 1: Agent Result Storage** 
   - Add AgentResult type and schema validation 
   - Update agent store to store and retrieve results 
   - Add error handling and retry logic 

2. **Phase 2: Context Passing and Immutability** 
   - Implement workflow context in the workflow store using standard immutable updates 
   - Update progressWorkflow to pass data between agents with proper error handling 
   - Modify agent execution to include previous agent output 
   - Implement telemetry for tracking data passing success 

3. **Phase 3: Browser-Use Integration** 
   - Enhance the agent adapter to use browser-use's context capabilities 
   - Add custom functions for accessing previous agent output 
   - Implement proper state serialization and deserialization 

4. **Phase 4: UI and Developer Experience** 
   - Add UI to visualize data flow between agents 
   - Implement debugging tools to inspect agent inputs/outputs 
   - Add configuration options for data passing behavior 
   - Create documentation for the data passing system 
   - **Note: Data Flow visualization is only available in development mode** 

## Implementation Status (Verified)

**Note:** The completion status listed below is verified as of 2025-04-11.

### Frontend Implementation (Verified)
1. **Agent Result Type Definition**: **Verified** (Implemented in `/apps/web/src/app-types/agent/result.ts`).
2. **Agent Store Enhancements**: **Partially Implemented / Missing**.
    - The `result` field in `AgentRuntimeState` is **Verified** (Implemented in `/apps/web/src/app-types/agent/state.ts`).
    - `setAgentResult` / `getAgentResult` methods in `useAgentStore`: **Not Found** (Missing from `/apps/web/src/stores/agent-store.ts`).
3. **Workflow Context Store**: **Partially Implemented / Implemented as Slice**.
    - The logic exists in `createWorkflowContext` within `/apps/web/src/stores/workflow/features/workflow-context.ts` but is not a standalone store and needs integration into the main workflow store.
4. **Workflow Execution Logic Update**: **Partially Implemented / Incorrect Implementation**.
    - The `progressWorkflow` function in `/apps/web/src/stores/workflow/features/workflow-execution.ts` attempts data passing but incorrectly tries to access a non-existent `agentResults` property on the agent store instead of using `agentState[id].result` or the context store.
5. **UI Components**: **Verified**.
    - `WorkflowDataViewer` exists and appears functional in `/apps/web/src/components/workflow/workflow-data-viewer.tsx`.
    - **Note:** This visualization component is intended for development mode only.

2.  **Backend (`browser-service`):**
    - **a) TaskRequest Model:** **Verified**.
        - The `TaskRequest` model in `/services/browser-service/main.py` includes the `previous_agent_output: Optional[Dict[str, Any]] = None` field.
    - **b) AgentAdapter Integration:** **Partially Implemented / Implemented Differently**.
        - The `AgentAdapter` class exists in `/services/browser-service/core/agent_adapter.py`.
        - The relevant method is named `execute_task`, not `run_agent_task`.
        - `execute_task` accepts the previous output (as `previous_output`).
        - The data is **not** passed directly to the underlying `Agent`'s execution method. Instead, it's injected into the browser context's storage state and made available via a custom `get_previous_agent_output` function added to the agent instance.

## Current Status & Next Steps

Detailed verification has revealed the following:

*   **Core data structures** (`AgentResult`, `AgentRuntimeState`, backend `TaskRequest`) are correctly defined.
*   The **UI component** for visualizing data exists.
*   **Frontend store logic** is incomplete: `agent-store` lacks methods to manage results, and the `workflow-context` logic is present but not integrated.
*   **Frontend execution logic** (`progressWorkflow`) attempts data passing but uses an incorrect method to retrieve results.
*   **Backend integration** passes data to the agent indirectly (via browser context and a custom function) rather than direct parameter passing.

To achieve functional workflow data passing, the following steps are required:

1.  **Implement Agent Result Handling in `agent-store.ts`:** ~~Add `setAgentResult` and `getAgentResult` methods (or equivalent logic) to manage the `result` within the agent's state.~~ **Completed**. Methods and state (`agentResult`) added to `agent-store.ts`.
2.  **Integrate Workflow Context Store:** ~~Incorporate the `createWorkflowContext` slice into the main `useWorkflowStore` (likely in `/apps/web/src/stores/workflow/index.ts` or similar composition root).~~ **Completed**. Slice integrated into `useWorkflowStore` in `/apps/web/src/stores/workflow/store.ts`.
3.  **Correct `progressWorkflow` Logic:** ~~Modify the data passing section in `/apps/web/src/stores/workflow/features/workflow-execution.ts` to correctly retrieve the completed agent's result using either the updated `agent-store` methods or the integrated `workflow-context` store methods.~~ **Completed**. Logic corrected to use `get().getAgentContextData(...)` in `/apps/web/src/stores/workflow/features/workflow-execution.ts`.
4.  **Align/Verify Backend Agent Data Access:** ~~Confirm that the underlying `browser-use` Agent is designed to access data via browser context/storage state or the custom `get_previous_agent_output` function. If not, or if direct passing is preferred, adjust the `AgentAdapter.execute_task` method accordingly.~~ **Verified (via Implementation Analysis)**. The `AgentAdapter.execute_task` method receives the `previous_output` (`AgentResult`) and injects a Python function `get_previous_agent_output` into the `browser-use` Agent instance. This function is designed to return the `data` payload from the `previous_output`. While the adapter *also* sets `context_config.storage_state = { "previous_output": ... }`, this structure doesn't conform to Playwright's standard for auto-populating browser storage. Therefore, the mechanism relies on the external `browser-use` library internally calling the injected Python function.
5.  **End-to-End Testing:** Once the above steps are completed, conduct thorough testing of a multi-agent workflow to ensure data is passed correctly between agents under various conditions.

## Verified Data Flow and Cache Status (as of 2025-04-11)

Based on detailed code review, the data passing mechanism between agents has been verified as follows:

### Frontend Data Flow (`apps/web`)

1.  **Result Storage:** When an agent task completes successfully, the `useAgent` hook is responsible for calling `useWorkflowStore.getState().updateWorkflowContext(agentId, result)` to store the `AgentResult` in the central `workflowContext.data` state.
2.  **Result Retrieval:** When `progressWorkflow` runs for the completed agent's node, it retrieves the stored result using `get().getAgentContextData(completedAgentId)`.
3.  **Injection into Next Agent:** `progressWorkflow` then updates the *next* agent's data in the separate `useAgentStore` by calling `useAgentStore.getState().setAgentData(nextAgentId, { ..., previousAgentOutput: completedAgentResult })`.
4.  **Request Construction:** When the `useAgent` hook runs for the next agent, it reads the `previousAgentOutput` from the `useAgentStore` and includes it in the `previous_agent_output` field of the request payload sent to the backend `/execute` endpoint.

### Backend Data Flow (`services/browser-service`)

1.  **Request Reception:** The `/execute` endpoint receives the `TaskRequest`, potentially including the `previous_agent_output`.
2.  **Dispatch:** It calls `run_task` in the background.
3.  **Adapter Call:** `run_task` passes the `task`, `llm_provider`, `options`, and `previous_agent_output` to `agent_adapter.execute_task`.
4.  **Data Injection:** `agent_adapter.execute_task` checks if `previous_output` exists. If it does, it adds a Python function named `get_previous_agent_output` to the underlying `browser_use` Agent instance. This function, when called (presumably by the LLM logic within the `browser-use` agent), returns the `data` payload from the `previous_output`. This makes the previous agent's result accessible to the current agent's execution logic.

### Frontend Cache Clearing

- A function `clearWorkflowContext` exists within the `useWorkflowStore` (defined in `stores/workflow/features/workflow-context.ts`). This function is designed to reset the `workflowContext.data` object, clearing the temporary storage of agent results.
- However, a codebase search confirmed that **this function is not currently called anywhere** within the `apps/web/src` codebase.
- Consequently, the agent results stored in `workflowContext.data` persist in the Zustand store's state until the web page is refreshed or the application is closed.

## Future Considerations / Open Questions
