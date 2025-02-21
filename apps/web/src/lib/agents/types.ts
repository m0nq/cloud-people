import { z } from 'zod';

import { AgentState } from '@app-types/agent';

// Model configuration
export interface ModelConfig {
    provider: string;
    name: string;
    parameters?: Record<string, unknown>;
    apiKey?: string;
}

// Framework configuration
export interface FrameworkConfig {
    type: 'langgraph' | 'browserbase' | 'stagehand' | 'custom';
    options?: Record<string, unknown>;
}

// Task interface for agent execution
export interface Task {
    id: string;
    type: string;
    input: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}

// Result interface for agent execution
export interface Result {
    id: string;
    taskId: string;
    output: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}

// Zod schema for runtime validation
export const AgentConfigSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    description: z.string(),
    model: z.object({
        provider: z.string(),
        name: z.string(),
        parameters: z.record(z.unknown()).optional(),
        apiKey: z.string().optional()
    }),
    framework: z.object({
        type: z.enum(['langgraph', 'browserbase', 'stagehand', 'custom']),
        options: z.record(z.unknown()).optional()
    }),
    tools: z.array(z.object({
        id: z.string().uuid(),
        name: z.string(),
        permissions: z.array(z.string())
    }))
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

// Error types for better error handling
export class AgentError extends Error {
    constructor(message: string, public details?: Record<string, unknown>) {
        super(message);
        this.name = 'AgentError';
    }
}

export class ModelError extends AgentError {
    constructor(message: string, details?: Record<string, unknown>) {
        super(message, details);
        this.name = 'ModelError';
    }
}

export class FrameworkError extends AgentError {
    constructor(message: string, details?: Record<string, unknown>) {
        super(message, details);
        this.name = 'FrameworkError';
    }
}
