import { JSONSchema7 } from 'json-schema';

export interface ToolResult<T = unknown> {
    success: boolean;
    data: T;
    error?: string;
}

export interface ExecutionMetrics {
    executionId: string;
    startTime: string;
    endTime: string;
}

export interface ITool<TParams = unknown, TResult = unknown> {
    name: string;
    description: string;
    version: string;
    category: 'browser' | 'llm' | 'data' | 'utility';
    parameters: ToolParameterSchema;
    metadata?: Record<string, unknown>;
    
    execute(params: TParams): Promise<ToolResult<TResult>>;
    validate?(params: TParams): ValidationResult;
    initialize?(): Promise<void>;
}

export type ToolParameterSchema = {
    [key: string]: {
        type: 'string' | 'number' | 'boolean' | 'object' | 'array';
        required: boolean;
        description?: string;
        enum?: string[];
        schema?: JSONSchema7;
    };
}

export interface ValidationResult {
    valid: boolean;
    errors?: string[];
}
