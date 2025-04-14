# Using Mock User Data in Development Mode

## Overview

This guide explains how to use the mock user context for testing workflow data passing functionality in development mode. The mock user context provides a simulated authenticated user and related data without requiring actual authentication.

## How It Works

In development mode (`NODE_ENV === 'development'`), the application automatically:

1. Bypasses authentication in the middleware
2. Provides a mock user via the `MockUserProvider`
3. Simulates API calls to fetch agents and workflows

This allows you to test features that normally require authentication, such as the workflow data passing system, without having to log in.

## Mock Data Available

### Mock User

A development user is automatically provided with the following properties:

```typescript
const mockUser = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'dev@cloudpeople.ai',
  username: 'devuser',
  first_name: 'Development',
  last_name: 'User',
  subscription_plan: 'pro',
  created_at: /* current timestamp */,
  updated_at: /* current timestamp */
};
```

### Mock Agents

Two pre-configured agents are available for testing:

```typescript
const mockAgents = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Research Agent',
    description: 'Performs research tasks and collects information',
    created_by: mockUser.id,
    agent_speed: 'Fast',
    memory_limit: '4GB',
    budget: 10.00,
    models: 'gemini-2.0-flash'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Data Processing Agent',
    description: 'Processes and analyzes data from various sources',
    created_by: mockUser.id,
    agent_speed: 'Instant',
    memory_limit: '2GB',
    budget: 5.00,
    models: 'gemini-2.0-flash'
  }
];
```

### Mock Workflow

A sample workflow is provided:

```typescript
const mockWorkflows = [
  {
    id: '33333333-3333-3333-3333-333333333333',
    user_id: mockUser.id,
    state: 'INITIAL',
    created_at: /* current timestamp */,
    updated_at: /* current timestamp */,
    data: {}
  }
];
```

## Testing Workflow Data Passing

### Step 1: Access the Canvas

In development mode, you can directly navigate to the canvas page without authentication:

```
http://localhost:3000/canvas
```

### Step 2: Create a Workflow

1. On the canvas page, use the UI controls to create a new workflow
2. Add multiple agent nodes to the workflow
3. Connect the nodes to establish the workflow sequence

### Step 3: Configure Data Passing

1. Configure the first agent to produce data in a specific format
2. Configure subsequent agents to consume data from previous agents
3. The `AgentResult` type will be used to structure the data passed between agents:

```typescript
// AgentResult structure
{
  version: string;        // e.g., "1.0"
  timestamp: string;      // ISO timestamp
  data: Record<string, any>; // The actual data being passed
  metadata?: Record<string, any>; // Optional metadata
}
```

### Step 4: Run the Workflow

1. Start the workflow execution
2. Monitor the execution of each agent
3. Observe how data is passed from one agent to the next

### Step 5: Visualize Data Flow

Use the `WorkflowDataViewer` component to visualize the data flow between agents. This component is automatically available in development mode and shows how data is passed through the workflow.

## Debugging

### Console Logs

The mock user context includes console logging for key actions:

```javascript
// When fetching mock agents
console.log('[MockUserContext] Returning mock agents:', mockAgents);

// When fetching mock workflows
console.log('[MockUserContext] Returning mock workflows:', mockWorkflows);
```

Check your browser's developer console to see these logs.

### React DevTools

You can use React DevTools to inspect:

1. The state of the `MockUserProvider`
2. The workflow context store
3. Agent results stored in the context

## Customizing Mock Data

If you need to customize the mock data for specific testing scenarios, modify the `mock-user-context.tsx` file:

```
/apps/web/src/contexts/mock-user-context.tsx
```

You can:

- Change the mock user properties
- Add or modify mock agents
- Create different mock workflows
- Customize the behavior of the simulated API functions

## Implementation Details

The mock user functionality is implemented in three main files:

1. `/apps/web/src/contexts/mock-user-context.tsx` - The mock user provider
2. `/apps/web/src/app/layout.tsx` - Conditional rendering in development mode
3. `/apps/web/src/lib/supabase/middleware.ts` - Authentication bypass in development

## Important Notes

- The mock user context is **only active in development mode**
- In production, real authentication is required
- The mock data is not persisted between page refreshes
- Any changes made to workflows or agents will be lost on refresh
