const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY'
] as const;

export const validateEnv = () => {
    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            throw new Error(`Missing required environment variable: ${envVar}`);
        }
    }
};
