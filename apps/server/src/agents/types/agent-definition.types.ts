import { z } from 'zod';

export const AgentDefinitionSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    created_by: z.string(),
    is_system: z.boolean(),
    tools: z.array(z.string()),
    default_config: z.record(z.unknown()),
    metadata: z.object({
        capabilities: z.array(z.string()),
        constraints: z.record(z.unknown())
    }),
    created_at: z.date(),
    updated_at: z.date()
});

export type AgentDefinition = z.infer<typeof AgentDefinitionSchema>;

export interface AgentExecutionState {
    status: 'initializing' | 'running' | 'completed' | 'error';
    progress?: number;
    currentStep?: string;
    result?: unknown;
    error?: string;
    metrics?: {
        startTime: Date;
        endTime?: Date;
        duration?: number;
        memoryUsage?: number;
        toolsUsed: string[];
    };
}
