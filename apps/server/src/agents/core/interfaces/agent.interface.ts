import { z } from 'zod';
import { ExecutionMetrics } from '@shared/metrics/metrics-collector';

export enum AgentStatus {
	IDLE = 'idle',
	INITIALIZING = 'initializing',
	RUNNING = 'running',
	PAUSED = 'paused',
	ERROR = 'error',
	COMPLETED = 'completed'
}

export interface IAgent<TContext = unknown, TResult = unknown> {
	initialize(): Promise<void>;
	execute(instruction: string): Promise<IAgentResponse<TResult>>;
	getState(): IAgentState<TContext>;
	cleanup(): Promise<void>;
}

export interface IAgentState<T = unknown> {
	status: AgentStatus;
	currentStep?: number;
	context: T;
	history: ExecutionHistory[];
	result?: unknown;
	error?: AgentError;
}

export interface IAgentResponse<T = unknown> {
	success: boolean;
	result?: T;
	error?: AgentError;
	metrics: ExecutionMetrics;
}

export interface IAgentConfig {
	name: string;
	description?: string;
	maxConcurrency?: number;
	timeout?: number;
	retryPolicy?: {
		maxAttempts: number;
		backoffFactor: number;
	};
	metricsConfig?: {
		collectMemory?: boolean;
		collectCPU?: boolean;
		collectTiming?: boolean;
		sampleInterval?: number;
	};
	tools: Array<{
		name: string;
		description: string;
		parameters: unknown;
	}>;
}

export interface IExecutionPlan<T = unknown> {
	steps: Array<IExecutionStep<T>>;
	metadata?: Record<string, unknown>;
}

export interface IExecutionStep<T = unknown> {
	action: string;
	params: T;
	validation?: (params: T) => ValidationResult;
}

export interface ExecutionHistory {
	timestamp: Date;
	step?: IExecutionStep;
	status: AgentStatus;
	result?: unknown;
	error?: AgentError;
	metrics?: ExecutionMetrics;
}

export interface AgentError {
	code: string;
	message: string;
	details?: unknown;
}

export interface ValidationResult {
	valid: boolean;
	errors?: string[];
}

// Zod schemas for runtime validation
export const AgentErrorSchema = z.object({
	code: z.string(),
	message: z.string(),
	details: z.unknown().optional()
});

export const ExecutionStepSchema = z.object({
	action: z.string(),
	params: z.unknown(),
	validation: z.function().optional()
});

export const ExecutionPlanSchema = z.object({
	steps: z.array(ExecutionStepSchema),
	metadata: z.record(z.string(), z.unknown()).optional()
});

export const ExecutionHistorySchema = z.object({
	timestamp: z.date(),
	step: ExecutionStepSchema.optional(),
	status: z.nativeEnum(AgentStatus),
	result: z.unknown().optional(),
	error: AgentErrorSchema.optional(),
	metrics: z.unknown().optional()
});

export const AgentStateSchema = z.object({
	status: z.nativeEnum(AgentStatus),
	currentStep: z.number().optional(),
	context: z.unknown(),
	history: z.array(ExecutionHistorySchema),
	result: z.unknown().optional(),
	error: AgentErrorSchema.optional()
});
