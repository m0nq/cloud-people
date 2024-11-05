import { QueryConfig } from '@lib/definitions';
import { queryDB } from '@lib/supabase/api';

export const connectToDB = async (queryString: string, config: QueryConfig) => {
    try {
        const { data: { collection: { records } } } = await queryDB(queryString, config);
        if (!records.length) {
            throw new Error('No records found');
        }
        return records;
    } catch (error) {
        // Log error details
        console.error('Database connection error:', error);
        throw error;
    }
};
