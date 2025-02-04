import { z } from 'zod';
import { IExecutionStep } from '../core/interfaces/agent.interface';
import { IExecutionPlan } from '../core/interfaces/agent.interface';
import { ValidationResult } from '../core/interfaces/agent.interface';

// Browser-specific implementations
export const BrowserActionSchema = z.object({
  action: z.enum(['navigate', 'clickElement', 'readText', 'typeText']),
  params: z.record(z.string(), z.string())
});

export type BrowserAction = z.infer<typeof BrowserActionSchema> & IExecutionStep<Record<string, string>>;

export const TaskPlanSchema = z.object({
  steps: z.array(BrowserActionSchema)
});

export type TaskPlan = z.infer<typeof TaskPlanSchema> & IExecutionPlan<BrowserAction>;

export interface BrowserContext {
  currentUrl?: string;
  pageTitle?: string;
  selectedElements?: string[];
  cookies?: Record<string, string>;
  localStorage?: Record<string, string>;
}

export interface BrowserAgentState {
  browserContext: BrowserContext;
  navigationHistory: string[];
  interactionHistory: BrowserAction[];
}
