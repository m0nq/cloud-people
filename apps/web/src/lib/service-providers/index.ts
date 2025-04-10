/**
 * Service Provider Factory
 *
 * This module provides a factory for creating service providers that can dynamically
 * switch between real and mock implementations based on a global mode setting.
 */

// Import environment configuration
import { getEnvConfig } from '../env';

// Define the provider mode type
export type ProviderMode = 'real' | 'mock';

// --- Global Mode Management ---

let currentGlobalMode: ProviderMode | null = null;
const serviceProxies: Array<{ updateInternalMode: (mode: ProviderMode) => void }> = [];

// Function to determine the initial mode (run once)
function initializeGlobalMode(): ProviderMode {
    if (currentGlobalMode !== null) {
        return currentGlobalMode;
    }

    const context = typeof window !== 'undefined' ? 'Client' : 'Server';
    console.log(`[${context}] Initializing global service provider mode...`);

    // Priority: Env override -> localStorage (client) -> Default ('real' dev, 'real' prod)
    const env = getEnvConfig();
    if (env.NEXT_PUBLIC_SERVICE_MODE === 'mock' || env.NEXT_PUBLIC_SERVICE_MODE === 'real') {
        console.log(`[${context}] Using env override: ${env.NEXT_PUBLIC_SERVICE_MODE}`);
        currentGlobalMode = env.NEXT_PUBLIC_SERVICE_MODE;
    } else if (context === 'Client') {
        const localStorageMode = localStorage.getItem('serviceProviderMode');
        if (localStorageMode === 'mock' || localStorageMode === 'real') {
            console.log(`[${context}] Using localStorageMode: ${localStorageMode}`);
            currentGlobalMode = localStorageMode;
        }
    }

    // Fallback to default (Now defaults to 'real' for development too)
    if (currentGlobalMode === null) {
        const defaultMode = 'real'; // New logic: Default to real unless overridden
        console.log(`[${context}] Falling back to default mode: ${defaultMode}`);
        currentGlobalMode = defaultMode;
    }

    console.log(`[${context}] Global mode initialized to: ${currentGlobalMode}`);
    return currentGlobalMode;
}

// Function to get the current global mode
export function getGlobalServiceProviderMode(): ProviderMode {
    return currentGlobalMode ?? initializeGlobalMode();
}

// Function to update the global mode and notify proxies
export function setGlobalServiceProviderMode(mode: ProviderMode): void {
    if (mode !== currentGlobalMode) {
        console.log(`[Client] Setting global service provider mode to: ${mode}`);
        currentGlobalMode = mode;
        if (typeof window !== 'undefined') {
            localStorage.setItem('serviceProviderMode', mode);
        }
        // Notify all existing proxies to update their internal mode
        serviceProxies.forEach(proxy => proxy.updateInternalMode(mode));
    }
}

// --- Service Provider Factory ---

export interface ServiceProviderConfig {
    // Optional: Can be used if specific instances need different defaults, though less common now
    defaultMode?: ProviderMode;
}

/**
 * Creates a dynamic service provider proxy.
 *
 * @param realImplementation The real implementation.
 * @param mockImplementation The mock implementation.
 * @returns A proxy object that delegates calls based on the current global service mode.
 */
export function createServiceProvider<T extends object>(
    realImplementation: T,
    mockImplementation: T,
    // Config is less critical now global state manages the mode, but kept for potential future use
    _config?: ServiceProviderConfig
): T & { _mode: ProviderMode } {

    let internalMode = getGlobalServiceProviderMode(); // Initialize with current global mode

    const proxyHandler: ProxyHandler<T> = {
        get: (target, prop, receiver) => {
            // Provide access to the current mode of this *specific* proxy instance
            if (prop === '_mode') {
                return internalMode;
            }

            // Internal function for the global setter to call
            // Note: Making this accessible via the proxy itself for simplicity here.
            // A more robust approach might use a separate registry.
            if (prop === 'updateInternalMode') {
                return (newMode: ProviderMode) => {
                    internalMode = newMode;
                };
            }

            // Choose implementation based on the proxy's current internal mode
            const currentImplementation = internalMode === 'real' ? realImplementation : mockImplementation;

            // Get the property from the chosen implementation
            // Ensure that currentImplementation is not null or undefined before accessing properties
            if (!currentImplementation) {
                console.error(`Service Provider Error: No implementation found for mode '${internalMode}' when accessing '${String(prop)}'`);
                // Decide how to handle this - throw error, return undefined, etc.
                // Returning undefined might mask issues, throwing might be better during dev
                throw new Error(`Service Provider Error: No implementation found for mode '${internalMode}'`);
            }

            const value = Reflect.get(currentImplementation, prop, receiver);

            // If it's a function, bind it to the correct implementation context
            if (typeof value === 'function') {
                // Ensure 'this' context is preserved for the original implementation
                return value.bind(currentImplementation);
            }

            return value;
        },
        // Optional: Trap other operations like 'set' if needed, though often 'get' is sufficient
        // set: (target, prop, value, receiver) => { ... }
    };

    // Create the proxy. Target is an empty object, handler does all the work.
    // Cast includes the internal update function type signature for registration
    const proxyInstance = new Proxy({}, proxyHandler) as T & { _mode: ProviderMode; updateInternalMode: (mode: ProviderMode) => void };

    // Register the proxy's update function so it can be notified of global changes
    // Ensure we don't add duplicates if this function were ever called multiple times for the same logical service
    if (!serviceProxies.some(p => p === proxyInstance)) { // Basic check, might need refinement
        serviceProxies.push(proxyInstance);
    }

    // Return type doesn't expose updateInternalMode externally
    return proxyInstance as T & { _mode: ProviderMode };
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
