import { z } from 'zod';

export const BrowserActionSchema = z.object({
  action: z.enum(['navigate', 'clickElement', 'readText', 'typeText']),
  params: z.record(z.string(), z.string())
});

export const TaskPlanSchema = z.object({
  steps: z.array(BrowserActionSchema)
});

export type BrowserAction = z.infer<typeof BrowserActionSchema>;

export type TaskPlan = z.infer<typeof TaskPlanSchema>;

export interface AgentResponse {
  success: boolean;
  result?: string;
  error?: string;
}
