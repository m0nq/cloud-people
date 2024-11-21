import { QueryConfig } from '@lib/definitions';
import { queryDB } from '@lib/supabase/api';

export const connectToDB = async (queryString: string, config: QueryConfig): Promise<any> => {
    try {
        const { data, errors } = await queryDB(queryString, config);

        if (errors?.length) {
            console.error('GraphQL Errors:', errors);
            throw new Error(errors[0].message);
        }

        if (!data || !data.collection) {
            throw new Error('No data returned from database');
        }

        // For mutations, we might not have records but still have a successful operation
        return data.collection.records || [];
    } catch (error) {
        // Log error details
        console.error('Database connection error:', error);
        throw error;
    }
};
