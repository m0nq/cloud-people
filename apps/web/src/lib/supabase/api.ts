'use server';
import { createClient } from './server';

import type { QueryConfig } from '@app-types/api';
import { Config } from '@config/constants';

const { API: { EndPoints } } = Config;

const SUPABASE_URL: string = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY: string = process.env.SUPABASE_ANON_KEY!;

// Fields that should be stringified before sending to the database
const JSON_FIELDS = [
    'config',      // Agent configuration
    'input',       // Execution input
    'output',      // Execution output
    'history',     // Execution history
    'metrics',     // Execution metrics
    'errors'      // Execution errors
] as const;

type JsonField = typeof JSON_FIELDS[number];

interface JsonValue {
    [key: string]: any;
}

/**
 * Safely stringify a JSON value, handling null/undefined
 */
const safeStringifyJson = (value: JsonValue | null | undefined): string | null => {
    if (value === null || value === undefined) {
        return null;
    }
    try {
        return JSON.stringify(value);
    } catch (error) {
        console.error('Failed to stringify JSON:', error);
        throw new Error('Failed to process JSON data');
    }
};

/**
 * Process variables before sending to the database
 * Handles JSON fields by stringifying them appropriately
 */
const processQueryVariables = (variables: QueryConfig): Record<string, any> => {
    // Handle null/undefined
    if (!variables) {
        return {};
    }

    return Object
        .entries(variables)
        .reduce((processed, [key, value]) => {
            // If this is a nested object (like the 'data' field in mutations)
            if (value && typeof value === 'object') {
                // If it's a field that needs to be stringified
                if (JSON_FIELDS.includes(key as JsonField)) {
                    processed[key] = safeStringifyJson(value);
                }
                // Otherwise process its fields recursively
                else {
                    processed[key] = processQueryVariables(value);
                }
            } else {
                processed[key] = value;
            }
            return processed;
        }, {} as Record<string, any>);
};

/**
 * Execute a GraphQL query against the Supabase database
 */
export const queryDB = async (query: string, variables: QueryConfig = {}) => {
    const supabase = await createClient();
    const { data: { session } } = await supabase!.auth.getSession();

    const processedVariables = processQueryVariables(variables);

    try {
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
            const errorText = await res.text();
            console.error('GraphQL request failed:', errorText);
            throw new Error(`GraphQL request failed: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();

        // Check for GraphQL errors
        if (data.errors) {
            console.error('GraphQL errors:', data.errors);
            throw new Error(data.errors[0]?.message || 'GraphQL query failed');
        }

        return data;
    } catch (error) {
        console.error('Failed to execute GraphQL query:', error);
        throw error instanceof Error
            ? error
            : new Error('Failed to execute GraphQL query');
    }
};
