'use server';
import { createClient } from './server';

const SUPABASE_URL: string = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY: string = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient();

export const queryDB = async (query: string, variables: Record<string, any> = {}) => {
    const { data: { session } } = await supabase.auth.getSession();

    const res = await fetch(`${SUPABASE_URL}/graphql/v1`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${session?.access_token ?? SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({ query, variables })
        }
    );

    if (!res.ok) {
        // This will activate the closest `error.js` Error Boundary
        throw new Error('Failed to fetch data');
    }

    return await res.json();
};
