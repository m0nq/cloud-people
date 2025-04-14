import { createBrowserClient } from '@supabase/ssr';

// Export the createBrowserClient function for use in service providers
export { createBrowserClient };

// Default client export
export const createClient = () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
