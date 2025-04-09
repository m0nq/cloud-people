const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];

export const validateEnv = () => {
    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            throw new Error(`Missing required environment variable: ${envVar}`);
        }
    }
};

/**
 * Environment configuration interface
 */
export interface EnvConfig {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    NODE_ENV: 'development' | 'production' | 'test';
    NEXT_PUBLIC_SERVICE_MODE?: 'real' | 'mock';
}

/**
 * Get the current environment configuration
 * This provides type-safe access to environment variables
 */
export function getEnvConfig(): EnvConfig {
    return {
        SUPABASE_URL: process.env.SUPABASE_URL || '',
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
        NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
        NEXT_PUBLIC_SERVICE_MODE: process.env.NEXT_PUBLIC_SERVICE_MODE as 'real' | 'mock' | undefined
    };
}
