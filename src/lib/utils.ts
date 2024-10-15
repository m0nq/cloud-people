import { notFound } from 'next/navigation';

import { QueryConfig } from '@lib/definitions';
import { QueryResults } from '@lib/definitions';
import { queryDB } from '@lib/supabase/api';

export const connectToDB = async (queryString: string, config: QueryConfig): Promise<any[]> => {
    const { data: { collection: { records } } }: QueryResults = await queryDB(queryString, { ...config } as QueryConfig);
    // if item not found, throw a local 404
    if (!records.length) {
        notFound();
    }
    return records;
};
