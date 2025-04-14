import { z } from 'zod';

/**
 * Schema for agent results with versioning and validation
 */
export const AgentResultSchema = z.object({
  version: z.string(),
  timestamp: z.string(),
  data: z.unknown(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

/**
 * Type for agent results derived from the schema
 */
export type AgentResult = z.infer<typeof AgentResultSchema>;
