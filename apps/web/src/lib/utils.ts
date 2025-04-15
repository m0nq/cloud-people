import type { QueryConfig } from '@app-types/api';
import { queryDB } from '@lib/supabase/api';

interface DatabaseError {
    message: string;
    query?: string;
    config?: any;
    originalError?: any;
}

const handleDatabaseError = (error: any, query: string, config: QueryConfig): never => {
    // Format error details
    const errorDetails: DatabaseError = {
        message: error.message,
        query,
        config,
        originalError: error
    };

    // Log detailed error for debugging
    console.error('Database Error:', JSON.stringify(errorDetails, null, 2));

    // Preserve GraphQL errors
    if (error.message.includes('GraphQL')) {
        throw error;
    }

    // Map specific errors to user-friendly messages
    if (error.message.includes('Failed to fetch data')) {
        throw new Error('Unable to connect to the database. Please check your internet connection.');
    }

    if (error.message.includes('row-level security policy')) {
        throw new Error('You do not have permission to perform this operation. Please check your access rights.');
    }

    // For JSON type errors, provide more specific message
    if (error.message.includes('Invalid input for JSON type')) {
        throw new Error('Invalid JSON data format. Please check the data structure being sent.');
    }

    // If we have a specific error message, use it
    if (error.message && !error.message.includes('Database operation failed')) {
        throw error;
    }

    // Generic error only as last resort
    throw new Error('Database operation failed. Please try again later.');
};

const validateQueryResponse = (data: any) => {
    if (!data) {
        throw new Error('No data returned from database');
    }

    // Prioritize checking for the specific 'collection' alias used in queries/mutations
    if (data.collection) {
        // Return the records array if 'collection' key exists
        return data.collection.records || [];
    }

    // If 'collection' alias is not present, check for standard mutation keys
    // (e.g., insertInto<Table>, update<Table>, deleteFrom<Table>)
    // Check if any key starts with these prefixes
    const dataKeys = Object.keys(data);
    const hasStandardMutationKey = dataKeys.some(key => 
        key.startsWith('insertInto') || 
        key.startsWith('deleteFrom') || 
        key.startsWith('update')
    );

    // Return the whole data object if a standard mutation key is found
    if (hasStandardMutationKey) {
        return data;
    }

    // If neither 'collection' nor standard mutation keys are found, it's an error
    throw new Error(
        'Invalid response format - expected "collection" key or a standard mutation key (insertInto/deleteFrom/update)'
    );
};

export const connectToDB = async (queryString: string, config: QueryConfig): Promise<any> => {
    try {
        if (!queryString) {
            throw new Error('Query string is required');
        }

        const { data, errors } = await queryDB(queryString, config);

        console.log('Raw GraphQL Response before validation:', JSON.stringify({ data, errors }, null, 2));

        if (errors?.length) {
            throw new Error(errors[0].message || 'Database operation failed');
        }

        return validateQueryResponse(data);
    } catch (error: any) {
        handleDatabaseError(error, queryString, config);
    }
};
