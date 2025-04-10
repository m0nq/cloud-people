/**
 * Service Provider Factory
 *
 * This module provides a factory for creating service providers that can be toggled
 * between real and mock implementations based on configuration flags.
 */

// Import environment configuration
import { getEnvConfig } from '../env';

// Define the provider mode type
export type ProviderMode = 'real' | 'mock';

// Service provider configuration
export interface ServiceProviderConfig {
    // Default provider mode to use
    defaultMode: ProviderMode;
    // Override mode from environment or localStorage
    overrideMode?: ProviderMode;
}

/**
 * Service provider factory function
 *
 * @param realImplementation The real implementation that connects to actual services
 * @param mockImplementation The mock implementation that simulates services
 * @param config Configuration options
 * @returns The appropriate service implementation based on current mode
 */
export function createServiceProvider<T>(
    realImplementation: T,
    mockImplementation: T,
    config: ServiceProviderConfig = { defaultMode: 'real' }
): T & { _mode: ProviderMode } {
    // Determine which mode to use
    const mode = determineProviderMode(config);

    // Select the appropriate implementation
    const implementation = mode === 'real' ? realImplementation : mockImplementation;

    // Add the mode property to the implementation for debugging
    // We need to create a new object that preserves the prototype chain
    const result = Object.create(Object.getPrototypeOf(implementation));

    // Copy all properties from the implementation
    Object.assign(result, implementation);

    // Add the _mode property
    result._mode = mode;

    return result as T & { _mode: ProviderMode };
}

/**
 * Determines which provider mode to use based on configuration and environment
 */
function determineProviderMode(config: ServiceProviderConfig): ProviderMode {
    const context = typeof window !== 'undefined' ? 'Client' : 'Server';
    console.log(`[${context}] Determining provider mode...`, config);

    // Check for explicit override mode in config
    if (config.overrideMode) {
        console.log(`[${context}] Using config.overrideMode: ${config.overrideMode}`);
        return config.overrideMode;
    }

    // Check for environment variable override
    const env = getEnvConfig();
    if (env.NEXT_PUBLIC_SERVICE_MODE === 'mock' || env.NEXT_PUBLIC_SERVICE_MODE === 'real') {
        console.log(`[${context}] Using env.NEXT_PUBLIC_SERVICE_MODE: ${env.NEXT_PUBLIC_SERVICE_MODE}`);
        return env.NEXT_PUBLIC_SERVICE_MODE;
    }

    // Check for localStorage override (client-side only)
    if (typeof window !== 'undefined') {
        const localStorageMode = localStorage.getItem('serviceProviderMode') as ProviderMode | null;
        console.log(`[${context}] localStorage serviceProviderMode:`, localStorageMode);
        if (localStorageMode === 'mock' || localStorageMode === 'real') {
            console.log(`[${context}] Using localStorageMode: ${localStorageMode}`);
            return localStorageMode;
        }
    }

    // Fall back to default mode
    console.log(`[${context}] Falling back to config.defaultMode: ${config.defaultMode}`);
    return config.defaultMode;
}

/**
 * Toggle the service provider mode in localStorage
 * This can be used in development tools to switch modes at runtime
 */
export function toggleServiceMode(mode: ProviderMode): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem('serviceProviderMode', mode);
        // Force a page refresh to apply the new mode
        window.location.reload();
    }
}
