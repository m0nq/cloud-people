'use server';
import { createClient } from './server';

import { QueryConfig } from '@lib/definitions';
import { Config } from '@config/constants';

const {
    API: { EndPoints }
} = Config;

const SUPABASE_URL: string = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY: string = process.env.SUPABASE_ANON_KEY!;

export const queryDB = async (query: string, variables: QueryConfig = {}) => {
    const supabase = await createClient();
    const {
        data: { session }
    } = await supabase!.auth.getSession();

    // Pre-process variables to handle JSON fields
    const processedVariables = Object.entries(variables).reduce(
        (acc, [key, value]) => {
            // If the value is an object and the key is 'config', stringify it
            console.log('Value:', value, 'Key:', key);
            if (value && typeof value === 'object' && key === 'config') {
                acc[key] = JSON.stringify(value);
            } else {
                acc[key] = value;
            }
            return acc;
        },
        {} as Record<string, any>
    );

    const res = await fetch(`${SUPABASE_URL}${EndPoints.GraphQL}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${session?.access_token ?? SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ query, variables: processedVariables })
    });

    if (!res.ok) {
        // This will activate the closest `error.js` Error Boundary
        console.error('GraphQL request failed:', await res.text());
        throw new Error('Failed to fetch data');
    }

    return await res.json();
};
