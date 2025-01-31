import { QueryConfig } from '@lib/definitions';
import { queryDB } from '@lib/supabase/api';

export const connectToDB = async (queryString: string, config: QueryConfig): Promise<any> => {
    try {
        if (!queryString) {
            throw new Error('Query string is required');
        }

        const { data, errors } = await queryDB(queryString, config);

        if (errors?.length) {
            console.error('GraphQL Errors:', JSON.stringify(errors, null, 2));
            throw new Error(errors[0].message || 'Database operation failed');
        }

        if (!data) {
            throw new Error('No data returned from database');
        }

        if (!data.collection) {
            throw new Error('Invalid response format - missing collection');
        }

        // For mutations, we might not have records but still have a successful operation
        return data.collection.records || [];
    } catch (error: any) {
        // Log detailed error information
        console.error('Database connection error:', {
            error: error.message,
            query: queryString,
            config: JSON.stringify(config, null, 2)
        });

        // Rethrow with a user-friendly message
        throw new Error(
            error.message.includes('Failed to fetch data')
                ? 'Unable to connect to the database. Please check your internet connection.'
                : 'Database operation failed. Please try again later.'
        );
    }
};
