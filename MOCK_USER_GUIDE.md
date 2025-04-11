# Mock User Guide for Workflow Data Passing Testing

## Overview

This guide explains how to use the mock user context we've implemented for testing workflow data passing functionality in development mode. The mock user context provides a simulated authenticated user and related data without requiring actual authentication, making it easier to test workflows during development.

## How It Works

We've implemented a `MockUserProvider` that automatically activates in development mode, providing:

1. A mock user with a fixed UUID
2. Mock agent data
3. Mock workflow data
4. Simulated API functions

This implementation is completely isolated to development environments and won't affect production code.

## Using the Mock User for Workflow Testing

### Accessing the Canvas

In development mode, you can now directly access the canvas at `/canvas` without authentication. The middleware is configured to bypass authentication checks in development, and the `MockUserProvider` simulates an authenticated user session.

### Testing Workflow Data Passing

To test the workflow data passing functionality:

1. Navigate to the canvas page
2. Create a workflow with multiple agents
3. Configure the first agent to produce some data
4. Configure subsequent agents to consume that data
5. Run the workflow

The mock user context provides two pre-configured agents:

- **Research Agent**: For performing research tasks
- **Data Processing Agent**: For processing data from various sources

These agents can be used to test the data passing functionality between workflow steps.

### Viewing Data Flow

The `WorkflowDataViewer` component will visualize the data flow between agents in your workflow. This is particularly useful for debugging and ensuring data is correctly passed between agents.

### Console Logging

The mock user context includes console logging for key actions:

```javascript
console.log('[MockUserContext] Returning mock agents:', mockAgents);
console.log('[MockUserContext] Returning mock workflows:', mockWorkflows);
```

Check your browser console to see when mock data is being used.

## Customizing Mock Data

If you need to customize the mock data for specific testing scenarios, you can modify the `mock-user-context.tsx` file:

```typescript
// Path: /apps/web/src/contexts/mock-user-context.tsx

// Modify the mock user
const mockUser = {
  id: '00000000-0000-0000-0000-000000000000', // Change this UUID if needed
  email: 'dev@cloudpeople.ai',
  // Add or modify other properties as needed
};

// Add or modify mock agents
const mockAgents = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Research Agent',
    // Customize agent properties
  },
  // Add more agents as needed
];

// Add or modify mock workflows
const mockWorkflows = [
  {
    id: '33333333-3333-3333-3333-333333333333',
    // Customize workflow properties
  },
];
```

## Testing Agent Results

To test the `AgentResult` data passing functionality specifically:

1. Create a workflow with at least two agents
2. Run the first agent to completion
3. Verify that its result is stored in the workflow context
4. Run the second agent and confirm it receives the first agent's output

Example agent result structure that will be passed between agents:

```json
{
  "version": "1.0",
  "timestamp": "2025-04-08T15:43:31.123Z",
  "data": {
    "key1": "value1",
    "key2": "value2"
  },
  "metadata": {
    "source": "Research Agent",
    "confidence": 0.95
  }
}
```

## Troubleshooting

### Mock User Not Working

If the mock user context isn't working:

1. Ensure you're in development mode (`NODE_ENV === 'development'`)
2. Check the browser console for any errors
3. Verify that the `MockUserProvider` is correctly imported and used in the layout

### Data Not Passing Between Agents

If data isn't passing correctly between agents:

1. Check the browser console for telemetry logs
2. Inspect the workflow context store state in React DevTools
3. Verify that the first agent is correctly setting its result
4. Ensure the second agent is configured to use the previous agent's output

## Production Considerations

Remember that this mock user context is only active in development mode. In production:

1. Real authentication will be required
2. Users will need to log in to access their agents and workflows
3. Real database queries will be made instead of using mock data

## Next Steps

Now that you can easily test workflow data passing in development, consider:

1. Adding more comprehensive test scenarios
2. Creating automated tests for the data passing functionality
3. Expanding the mock data to cover more edge cases

Happy testing!
