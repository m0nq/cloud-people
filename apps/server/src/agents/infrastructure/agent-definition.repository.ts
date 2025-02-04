import { SupabaseClient } from '@supabase/supabase-js';

import { Database } from '@shared/infrastructure/database.types';
import { BaseRepository } from '@shared/infrastructure/base.repository';
import { AgentDefinition } from '@agents/types/agent-definition.types';

export class AgentDefinitionRepository extends BaseRepository<AgentDefinition> {
    constructor(client: SupabaseClient<Database>) {
        super(client, 'Agents');
    }

    private transformDatabaseResponse(data: any): AgentDefinition {
        return {
            id: data.id,
            name: data.name,
            description: data.description || '',
            created_by: data.created_by,
            is_system: data.is_system,
            tools: data.tools || [],
            default_config: data.default_config || {},
            metadata: {
                capabilities: data.metadata?.capabilities || [],
                constraints: data.metadata?.constraints || {}
            },
            created_at: new Date(data.created_at),
            updated_at: new Date(data.updated_at)
        };
    }

    async getSystemAgents(): Promise<AgentDefinition[]> {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .eq('is_system', true);

        if (error) throw error;
        return data.map(item => this.transformDatabaseResponse(item));
    }

    async getUserAgents(userId: string): Promise<AgentDefinition[]> {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .eq('created_by', userId);

        if (error) throw error;
        return data.map(item => this.transformDatabaseResponse(item));
    }

    async getAgentById(id: string): Promise<AgentDefinition | null> {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data ? this.transformDatabaseResponse(data) : null;
    }
}
