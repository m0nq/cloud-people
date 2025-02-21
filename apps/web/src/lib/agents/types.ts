import { z } from 'zod';

// Model configuration
export interface ModelConfig {
    provider: string;
    name: string;
    parameters?: Record<string, unknown>;
    apiKey?: string;
}

export enum FrameworkType {
    langgraph = 'langgraph',
    browserbase = 'browserbase',
    stagehand = 'stagehand',
    custom = 'custom'
}

// Framework configuration
export interface FrameworkConfig {
    type: FrameworkType;
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

// Tool interface for agent capabilities
export interface Tool {
    initialize(): Promise<void>;

    execute(action: string, params: Record<string, unknown>): Promise<Record<string, unknown>>;

    cleanup(): Promise<void>;
}

// Tool configuration
export interface ToolConfig {
    name: string;
    description: string;
    actions: {
        [key: string]: {
            description: string;
            parameters: Record<string, unknown>;
        }
    };
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
        name: z.string(),
        description: z.string(),
        actions: z.record(z.object({
            description: z.string(),
            parameters: z.record(z.unknown())
        }))
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
