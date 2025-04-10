# Service Provider Pattern for Development and Testing

## Overview

This document explains how to use the service provider pattern implemented in the Cloud People project to easily toggle between real and mock implementations of various services. This approach is particularly useful for development and testing, allowing you to work with mock data when needed and switch to real services when required.

## Key Benefits

- **Seamless Switching**: Toggle between real and mock services with a single click in the UI or by changing an environment variable
- **Consistent API**: Both real and mock implementations share the same interface, ensuring consistent usage throughout the application
- **Development Flexibility**: Work offline or without authentication during development
- **Improved Testing**: Easily test workflows with predictable mock data
- **Production Safety**: Automatically uses real services in production environments

## How It Works

The service provider pattern uses a factory function that returns either a real or mock implementation based on the current configuration. The decision is made based on:

1. Explicit configuration override
2. Environment variables
3. Local storage settings (for client-side toggling)
4. Default mode based on the environment (development vs. production)

## Available Service Providers

### User Service

The user service handles authentication, user profiles, and related data:

```typescript
// Import the user service
import { userService } from '@lib/service-providers/user-service';

// Use the service (same API regardless of mode)
const user = await userService.getCurrentUser();
const agents = await userService.getAgents();
```

#### Real Implementation

The real implementation connects to Supabase for authentication and database operations. It:

- Manages user sessions with Supabase Auth
- Retrieves user profiles from the database
- Fetches agents and workflows from their respective tables

#### Mock Implementation

The mock implementation provides simulated data and authentication:

- Returns a predefined mock user with ID `00000000-0000-0000-0000-000000000000`
- Provides sample agents and workflows for testing
- Simulates API delays for realistic behavior
- Logs operations to the console for debugging

## Using the Development Toolbar

In development mode, a toolbar is available in the bottom-right corner of the application. This toolbar allows you to:

1. Toggle between real and mock service modes
2. See the current environment
3. Access other development tools

### Toggling Service Mode

Click the toggle switch in the development toolbar to switch between real and mock services. The page will refresh to apply the new mode.

## Configuration Options

### Environment Variables

You can control the service mode using environment variables:

```env
# Force mock mode even in production (for testing)
NEXT_PUBLIC_SERVICE_MODE=mock

# Force real mode even in development
NEXT_PUBLIC_SERVICE_MODE=real
```

### Local Storage

The service mode can also be stored in local storage, which takes precedence over the default mode but not over environment variables:

```javascript
// Set mock mode
localStorage.setItem('serviceProviderMode', 'mock');

// Set real mode
localStorage.setItem('serviceProviderMode', 'real');

// Clear override (use default based on environment)
localStorage.removeItem('serviceProviderMode');
```

## Using Mock Data for Workflow Testing

### Testing Workflow Data Passing

The mock user service provides predefined agents that can be used to test workflow data passing:

1. Toggle to mock mode using the development toolbar
2. Navigate to the canvas page
3. Create a workflow with the mock agents
4. Test data passing between agents

### Available Mock Data

#### Mock User

```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "email": "dev@cloudpeople.ai",
  "username": "devuser",
  "first_name": "Development",
  "last_name": "User",
  "subscription_plan": "pro"
}
```

#### Mock Agents

```json
[
  {
    "id": "11111111-1111-1111-1111-111111111111",
    "name": "Research Agent",
    "description": "Performs research tasks and collects information",
    "agent_speed": "Fast",
    "memory_limit": "4GB",
    "budget": 10.00,
    "models": "gemini-2.0-flash"
  },
  {
    "id": "22222222-2222-2222-2222-222222222222",
    "name": "Data Processing Agent",
    "description": "Processes and analyzes data from various sources",
    "agent_speed": "Instant",
    "memory_limit": "2GB",
    "budget": 5.00,
    "models": "gemini-2.0-flash"
  }
]
```

#### Mock Workflow

```json
{
  "id": "33333333-3333-3333-3333-333333333333",
  "user_id": "00000000-0000-0000-0000-000000000000",
  "state": "INITIAL",
  "data": {}
}
```

## Extending the Pattern

### Creating New Service Providers

To create a new service provider:

1. Define an interface for the service
2. Create real and mock implementations
3. Use the `createServiceProvider` factory function

Example:

```typescript
// Define the interface
interface MyService {
  getData(): Promise<any[]>;
  processItem(id: string): Promise<any>;
}

// Create real implementation
class RealMyService implements MyService {
  // Real implementation that connects to actual services
}

// Create mock implementation
class MockMyService implements MyService {
  // Mock implementation with predefined data
}

// Create and export the service
export const myService = createServiceProvider<MyService>(
  new RealMyService(),
  new MockMyService(),
  { defaultMode: process.env.NODE_ENV === 'production' ? 'real' : 'mock' }
);
```

## Debugging

### Console Logs

The mock implementations include console logs to help with debugging:

```
[MockUserService] Initialized with mock user: dev@cloudpeople.ai
[MockUserService] Returning mock user
[MockUserService] Returning mock agents: [Array(2)]
```

Check your browser's developer console to see these logs when using mock services.

### Service Mode Indicator

You can check which mode a service is using via the `_mode` property:

```typescript
console.log('Current user service mode:', userService._mode); // 'real' or 'mock'
```

## Best Practices

1. **Default to Mock in Development**: For faster development cycles, the default is set to mock mode in development
2. **Always Use Real in Production**: The system automatically uses real services in production
3. **Test Both Modes**: Before deploying, test your features with both real and mock services
4. **Keep Interfaces Consistent**: Ensure both implementations follow the same interface
5. **Simulate Realistic Behavior**: Include delays and error conditions in mock implementations

## Implementation Details

The service provider pattern is implemented in the following files:

- `/apps/web/src/lib/service-providers/index.ts` - The core factory function
- `/apps/web/src/lib/service-providers/user-service.ts` - User service implementation
- `/apps/web/src/contexts/user-context.tsx` - React context provider
- `/apps/web/src/components/dev/dev-toolbar.tsx` - Development toolbar

## Conclusion

The service provider pattern gives you the flexibility to develop and test with either real or mock services. By using this pattern, you can work more efficiently during development and ensure your application works correctly with both mock and real data.
