/**
 * Agent Service Provider
 *
 * This module provides real and mock implementations for agent operations.
 */

import { createServiceProvider } from '.';
import { AgentData, AgentSpeed, MemoryLimit } from '@app-types/agent';
import { authCheck } from '@lib/actions/authentication-actions';
import { connectToDB } from '@lib/utils';
import type { QueryConfig } from '@app-types/api';

// Define the interface for our agent service
export interface AgentService {
    // Agent methods
    createAgent(config: QueryConfig): Promise<AgentData>;

    fetchAgent(config: QueryConfig): Promise<AgentData>;

    fetchAgents(): Promise<AgentData[]>;
}

/**
 * Real agent service implementation that connects to the database
 */
class RealAgentService implements AgentService {
    async createAgent(config: QueryConfig = {}): Promise<AgentData> {
        const user = await authCheck();

        const createAgentMutation = `
        mutation CreateAgentMutation($name: String!, $description: String, $speed: AgentSpeed!, $contextWindow: String, $memoryLimit: String, $budget: BigFloat, $models: [String], $createdBy: UUID) {
            collection: insertIntoAgentsCollection(
                objects: [{name: $name, description: $description, agent_speed: $speed, context_window: $contextWindow, memory_limit: $memoryLimit, budget: $budget, models: $models, created_by: $createdBy}]
            ) {
                records {
                    id
                    name
                    description
                    agent_speed
                    context_window
                    memory_limit
                    budget
                    models
                    created_by
                }
            }
        }
    `;

        try {
            const [agent] = await connectToDB(createAgentMutation, {
                ...config.data,
                createdBy: user.id
            });

            if (!agent?.id) {
                throw new Error('Failed to create agent');
            }

            // If tools are provided, create tool associations
            if (config.data?.tools?.length) {
                const createAgentToolsMutation = `
            mutation CreateAgentToolsMutation($objects: [AgentToolsInsertInput!]!) {
                collection: insertIntoAgentToolsCollection(objects: $objects) {
                    records {
                        id
                        agent_id
                        tool_id
                        configuration
                    }
                }
            }
        `;

                await connectToDB(createAgentToolsMutation, {
                    objects: config.data.tools.map((tool: any) => ({
                        agent_id: agent.id,
                        tool_id: tool.id,
                        configuration: tool.configuration || {}
                    }))
                });
            }

            return {
                ...agent,
                speed: agent.agent_speed as AgentSpeed,
                memoryLimit: agent.memory_limit as MemoryLimit,
                createdBy: agent.created_by,
                budget: String(agent.budget || '0'),
                model: Array.isArray(agent.models) && agent.models.length > 0 ? agent.models[0] : 'gemini-2.0-flash'
            };
        } catch (error) {
            console.error('Failed to create agent:', error);
            throw error;
        }
    }

    async fetchAgent(config: QueryConfig = {}): Promise<AgentData> {
        const user = await authCheck();

        const fetchAgentQuery = `
        query AgentQuery($agentId: UUID!, $userId: UUID!) {
            collection: agentsCollection(filter: { id: { eq: $agentId }, created_by: { eq: $userId } }) {
                records: edges {
                    agent: node {
                        id
                        name
                        description
                        agent_speed
                        created_by
                        memory_limit
                        context_window
                        budget
                    }
                }
            }
        }
    `;

        try {
            const [record] = await connectToDB(fetchAgentQuery, {
                id: config.agentId,
                userId: user.id
            });

            if (!record) {
                throw new Error('Agent not found');
            }

            return {
                ...record.agent,
                speed: record.agent.agent_speed as AgentSpeed,
                memoryLimit: record.agent.memory_limit as MemoryLimit,
                createdBy: record.agent.created_by,
                budget: String(record.agent.budget || '0'),
                model: 'gemini-2.0-flash'
            };
        } catch (error) {
            console.error('Error fetching agent:', error);
            throw error;
        }
    }

    async fetchAgents(): Promise<AgentData[]> {
        const user = await authCheck();

        const fetchAgentsQuery = `
        query FetchAgentsQuery($userId: UUID!) {
            collection: agentsCollection(filter: { created_by: { eq: $userId } }) {
                records: edges {
                    agent: node {
                        id
                        name
                        agent_speed
                        description
                        created_by
                        memory_limit
                        budget
                    }
                }
            }
        }
    `;

        try {
            const records = await connectToDB(fetchAgentsQuery, {
                userId: user.id
            });

            return records.map((record: any) => ({
                ...record.agent,
                speed: record.agent.agent_speed as AgentSpeed,
                memoryLimit: record.agent.memory_limit as MemoryLimit || MemoryLimit.Medium,
                createdBy: record.agent.created_by,
                budget: String(record.agent.budget || '0'),
                model: 'gemini-2.0-flash'
            }));
        } catch (error) {
            console.error('Error fetching agents:', error);
            throw error;
        }
    }
}

/**
 * Mock agent service implementation that simulates database operations
 */
class MockAgentService implements AgentService {
    // Mock agents data
    private mockAgents: AgentData[] = [
        {
            id: '11111111-1111-1111-1111-111111111111',
            name: 'Research Agent',
            description: 'Performs research tasks and collects information',
            createdBy: '00000000-0000-0000-0000-000000000000',
            speed: AgentSpeed.Fast,
            memoryLimit: MemoryLimit.Medium,
            budget: '10.00',
            model: 'gemini-2.0-flash',
            tools: []
        },
        {
            id: '22222222-2222-2222-2222-222222222222',
            name: 'Data Processing Agent',
            description: 'Processes and analyzes data from various sources',
            createdBy: '00000000-0000-0000-0000-000000000000',
            speed: AgentSpeed.Instant,
            memoryLimit: MemoryLimit.Small,
            budget: '5.00',
            model: 'gemini-2.0-flash',
            tools: []
        },
        {
            id: '33333333-3333-3333-3333-333333333333',
            name: 'Content Creation Agent',
            description: 'Creates and edits content based on instructions',
            createdBy: '00000000-0000-0000-0000-000000000000',
            speed: AgentSpeed.Slow,
            memoryLimit: MemoryLimit.Large,
            budget: '15.00',
            model: 'gemini-2.0-pro',
            tools: []
        }
    ];

    constructor() {
        console.log('[MockAgentService] Initialized with mock agents');
    }

    async createAgent(config: QueryConfig = {}): Promise<AgentData> {
        // Simulate API delay
        await this.delay(500);

        const newAgent: AgentData = {
            id: crypto.randomUUID(),
            name: config.data?.name || 'New Agent',
            description: config.data?.description || 'A new agent',
            createdBy: '00000000-0000-0000-0000-000000000000',
            speed: config.data?.speed as AgentSpeed || AgentSpeed.Fast,
            memoryLimit: config.data?.memoryLimit as MemoryLimit || MemoryLimit.Medium,
            budget: config.data?.budget?.toString() || '10.00',
            model: config.data?.model || 'gemini-2.0-flash',
            tools: []
        };

        this.mockAgents.push(newAgent);
        console.log('[MockAgentService] Created new agent:', newAgent.name);

        return newAgent;
    }

    async fetchAgent(config: QueryConfig = {}): Promise<AgentData> {
        // Simulate API delay
        await this.delay(300);

        const agent = this.mockAgents.find(a => a.id === config.agentId);

        if (!agent) {
            console.error(`[MockAgentService] Agent not found with ID: ${config.agentId}`);
            throw new Error('Agent not found');
        }

        console.log(`[MockAgentService] Fetched agent: ${agent.name}`);
        return agent;
    }

    async fetchAgents(): Promise<AgentData[]> {
        // Simulate API delay
        await this.delay(300);

        console.log('[MockAgentService] Fetched all agents:', this.mockAgents.length);
        return this.mockAgents;
    }

    // Helper to simulate API delays
    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create and export the agent service with automatic mode switching
export const agentService = createServiceProvider<AgentService>(
    new RealAgentService(),
    new MockAgentService(),
    {
        // Default to real in production, mock in development
        defaultMode: process.env.NODE_ENV === 'production' ? 'real' : 'mock'
    }
);

// Export a hook for accessing the agent service
export function useAgentService() {
    return agentService;
}
