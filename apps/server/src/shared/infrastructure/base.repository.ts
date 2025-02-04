import { SupabaseClient } from '@supabase/supabase-js';

import { Database } from './database.types';

export abstract class BaseRepository<
    T extends { id: string },
    TInsert extends Database['public']['Tables'][keyof Database['public']['Tables']]['Insert'] = Database['public']['Tables'][keyof Database['public']['Tables']]['Insert']
> {
    constructor(
        protected readonly client: SupabaseClient<Database>,
        protected readonly tableName: keyof Database['public']['Tables']
    ) {}

    async create(entity: TInsert): Promise<T> {
        const { data, error } = await this.client
            .from(this.tableName)
            .insert(entity)
            .select()
            .single();

        if (error) throw error;
        return data as unknown as T;
    }

    async findById(id: string): Promise<T | null> {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as unknown as T;
    }

    async findAll(): Promise<T[]> {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*');

        if (error) throw error;
        return data as unknown as T[];
    }

    async update(id: string, entity: Partial<T>): Promise<T> {
        const { data, error } = await this.client
            .from(this.tableName)
            .update(entity)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as unknown as T;
    }

    async delete(id: string): Promise<void> {
        const { error } = await this.client
            .from(this.tableName)
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
}
