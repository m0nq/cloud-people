'use server';
import { createClient } from './server';

import { QueryConfig } from '@lib/definitions';
import { Config } from '@config/constants';

const { API: { EndPoints } } = Config;

const SUPABASE_URL: string = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY: string = process.env.SUPABASE_ANON_KEY!;

export const queryDB = async (query: string, variables: QueryConfig = {}) => {
    // In development, we'll use the ANON_KEY directly without trying to get a session
    let authToken = SUPABASE_ANON_KEY;

    if (process.env.NODE_ENV !== 'development') {
        const supabase = await createClient();
        const { data: { session } } = await supabase!.auth.getSession();
        authToken = session?.access_token ?? SUPABASE_ANON_KEY;
    }

    const res = await fetch(`${SUPABASE_URL}${EndPoints.GraphQL}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ query, variables })
    });

    if (!res.ok) {
        console.error('GraphQL request failed:', await res.text());
        throw new Error('Failed to fetch data');
    }

    return await res.json();
};
