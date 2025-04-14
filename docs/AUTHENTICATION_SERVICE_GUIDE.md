# Authentication Service Guide

## Overview

This guide explains how to use the service provider pattern for authentication in the Cloud People project. The implementation allows you to easily toggle between real authentication (using Supabase) and mock authentication during development.

## How Authentication Works

The authentication system in Cloud People is designed to be flexible, allowing you to:

1. Use real authentication with Supabase in production
2. Toggle between real and mock authentication during development
3. Override the authentication mode using environment variables or local storage

## Authentication Modes

### Mock Mode

In mock mode:

- No real authentication is required
- A predefined mock user is used (`dev-user-id`)
- You can access all routes without logging in
- Login forms automatically redirect to the home page

### Real Mode

In real mode:

- Full Supabase authentication is required
- Users must log in with valid credentials
- Protected routes enforce authentication
- Session management works normally

## Toggling Between Modes

### Using the Development Toolbar

The easiest way to toggle between authentication modes is to use the development toolbar:

1. Look for the toolbar in the bottom-right corner of the application
2. Click the toggle switch to switch between real and mock modes
3. The page will refresh to apply the new mode

### Using Environment Variables

You can also control the authentication mode using environment variables:

```env
# Force mock authentication even in production (for testing)
NEXT_PUBLIC_SERVICE_MODE=mock

# Force real authentication even in development
NEXT_PUBLIC_SERVICE_MODE=real
```

### Using Local Storage

For client-side toggling, you can use local storage:

```javascript
// Set mock mode
localStorage.setItem('serviceProviderMode', 'mock');

// Set real mode
localStorage.setItem('serviceProviderMode', 'real');

// Clear override (use default based on environment)
localStorage.removeItem('serviceProviderMode');
```

## Logging In

### With Mock Authentication

When using mock authentication:

1. Simply navigate to any page - you'll be automatically logged in as the mock user
2. The login form will automatically redirect to the home page
3. No real credentials are required

### With Real Authentication

When using real authentication:

1. Navigate to the login page
2. Enter your email address
3. You'll receive a magic link via email
4. Click the link to complete the authentication process

## Implementation Details

The authentication service provider pattern is implemented in the following files:

- `/apps/web/src/lib/actions/authentication-actions.ts` - Server actions for authentication
- `/apps/web/src/lib/supabase/middleware.ts` - Middleware for session management
- `/apps/web/src/lib/service-providers/index.ts` - Service provider factory
- `/apps/web/src/contexts/user-context.tsx` - User context provider

### How It Works

The system determines which authentication mode to use based on the following priority:

1. Environment variable (`NEXT_PUBLIC_SERVICE_MODE`)
2. Local storage setting (`serviceProviderMode`)
3. Default based on environment (mock in development, real in production)

This check is performed in multiple places:

- In the middleware for route protection
- In server actions for authentication operations
- In the user context for client-side authentication state

## Best Practices

1. **Development**: Use mock authentication for faster development cycles
2. **Testing Real Auth**: Toggle to real mode when you need to test the actual authentication flow
3. **Production**: Always use real authentication in production
4. **CI/CD**: Set up your CI/CD pipeline to use real authentication for testing

## Troubleshooting

### Can't Log In with Real Authentication

If you're having trouble logging in with real authentication:

1. Ensure you've toggled to real mode using the development toolbar
2. Check that your Supabase instance is properly configured
3. Verify that you're using a valid email address
4. Check your email for the magic link

### Stuck in Mock Mode

If you can't switch to real mode:

1. Clear your browser's local storage
2. Check your environment variables
3. Restart the development server

## Conclusion

The service provider pattern for authentication gives you the flexibility to develop and test with either real or mock authentication. By using this pattern, you can work more efficiently during development while ensuring your application works correctly with real authentication in production.
