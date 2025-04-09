'use server';

import type { QueryConfig } from '@app-types/api';
import { AgentData } from '@app-types/agent';
import { agentService } from '@lib/service-providers/agent-service';
import { getEnvConfig } from '@lib/env';

// Get service mode from environment
const getServiceMode = () => {
    const env = getEnvConfig();
    // Check for explicit service mode override
    if (env.NEXT_PUBLIC_SERVICE_MODE === 'mock' || env.NEXT_PUBLIC_SERVICE_MODE === 'real') {
        return env.NEXT_PUBLIC_SERVICE_MODE;
    }
    // Default to mock in development, real in production
    return process.env.NODE_ENV === 'development' ? 'mock' : 'real';
};

export const createAgent = async (config: QueryConfig = {}): Promise<AgentData> => {
    return agentService.createAgent(config);
};

export const fetchAgent = async (config: QueryConfig = {}): Promise<AgentData> => {
    return agentService.fetchAgent(config);
};

export const fetchAgents = async (): Promise<AgentData[]> => {
    return agentService.fetchAgents();
};
