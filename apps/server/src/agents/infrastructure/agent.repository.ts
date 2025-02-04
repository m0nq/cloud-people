import { createClient } from '@supabase/supabase-js';
import { SupabaseClient } from '@supabase/supabase-js';

import { BaseRepository } from '@shared/infrastructure/base.repository';
import { Database } from '@shared/infrastructure/database.types';
import { IAgentConfig } from '@agents/core/interfaces/agent.interface';
import { AgentStatus } from '@agents/core/interfaces/agent.interface';

export type AgentRow = Database['public']['Tables']['Agents']['Row'];
export type AgentInsert = Omit<Database['public']['Tables']['Agents']['Insert'], 'id' | 'created_at'>;
export type ExecutionRow = Database['public']['Tables']['Executions']['Row'];
export type ExecutionInsert = Omit<Database['public']['Tables']['Executions']['Insert'], 'id' | 'created_at'>;

type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];
type Json = JsonValue;

export class AgentRepository extends BaseRepository<AgentRow> {
    constructor(client: SupabaseClient<Database>) {
        super(client, 'Agents');
    }

    async createAgent(config: IAgentConfig, userId: string): Promise<AgentRow> {
        const configJson: { [key: string]: JsonValue } = {
            name: config.name,
            description: config.description ?? null,
            maxConcurrency: config.maxConcurrency ?? null,
            timeout: config.timeout ?? null,
            retryPolicy: config.retryPolicy
                ? {
                    maxAttempts: config.retryPolicy.maxAttempts,
                    backoffFactor: config.retryPolicy.backoffFactor
                }
                : null,
            metricsConfig: config.metricsConfig
                ? {
                    collectMemory: config.metricsConfig.collectMemory ?? false,
                    collectCPU: config.metricsConfig.collectCPU ?? false,
                    collectTiming: config.metricsConfig.collectTiming ?? false,
                    sampleInterval: config.metricsConfig.sampleInterval ?? null
                }
                : null,
            tools: config.tools
                ? config.tools.map(tool => ({
                    name: tool.name,
                    description: tool.description,
                    parameters: JSON.stringify(tool.parameters)
                }))
                : []
        };

        const { data, error } = await this.client
            .from(this.tableName)
            .insert({
                name: config.name,
                description: config.description || null,
                config: configJson,
                user_id: userId
            })
            .select('*')
            .single();

        if (error) throw error;
        if (!data) throw new Error('Failed to create agent');
        return data as AgentRow;
    }

    async getAgentsByUser(userId: string): Promise<AgentRow[]> {
        const { data, error } = await this.client
            .from(this.tableName)
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        if (!data) return [];
        return data as AgentRow[];
    }

    async updateAgentConfig(agentId: string, config: Partial<IAgentConfig>): Promise<AgentRow> {
        const configJson: { [key: string]: JsonValue } = {};

        if (config.name !== undefined) configJson.name = config.name;
        if (config.description !== undefined) configJson.description = config.description;
        if (config.maxConcurrency !== undefined) configJson.maxConcurrency = config.maxConcurrency;
        if (config.timeout !== undefined) configJson.timeout = config.timeout;

        if (config.retryPolicy) {
            configJson.retryPolicy = {
                maxAttempts: config.retryPolicy.maxAttempts,
                backoffFactor: config.retryPolicy.backoffFactor
            };
        }

        if (config.metricsConfig) {
            configJson.metricsConfig = {
                collectMemory: config.metricsConfig.collectMemory ?? false,
                collectCPU: config.metricsConfig.collectCPU ?? false,
                collectTiming: config.metricsConfig.collectTiming ?? false,
                sampleInterval: config.metricsConfig.sampleInterval ?? null
            };
        }

        if (config.tools) {
            configJson.tools = config.tools.map(tool => ({
                name: tool.name,
                description: tool.description,
                parameters: JSON.stringify(tool.parameters)
            }));
        }

        const { data, error } = await this.client
            .from(this.tableName)
            .update({ config: configJson })
            .eq('id', agentId)
            .select('*')
            .single();

        if (error) throw error;
        if (!data) throw new Error('Agent not found');
        return data as AgentRow;
    }

    async recordExecution(agentId: string, input: unknown, output: unknown, error?: unknown): Promise<void> {
        const execution = {
            agent_id: agentId,
            session_id: crypto.randomUUID(),
            input: input as Json,
            output: output as Json,
            errors: error as Json
        };

        const { error: dbError } = await this.client.from('Executions').insert(execution);
        if (dbError) {
            console.error('Failed to record execution:', dbError);
            throw new Error('Failed to record execution');
        }
    }

    async getAgentExecutions(agentId: string): Promise<ExecutionRow[]> {
        const { data, error } = await this.client
            .from('Executions')
            .select('*')
            .eq('agent_id', agentId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }
}
