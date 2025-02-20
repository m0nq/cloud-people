export type AgentAction = {
    type: 'browser';
    command: 'navigate' | 'close';
    url?: string;
    params?: Record<string, string>;
};

export type AgentCapability = {
    id: string;
    name: string;
    description: string;
    action: string;
    parameters?: {
        url?: string;
        [key: string]: any;
    };
    url?: string;
};

export enum AgentSpeed {
    Instant = 'Instant',
    Fast = 'Fast',
    Slow = 'Slow'
}

export enum MemoryLimit {
    Small = '8g',
    Medium = '16g',
    Large = '32g'
}

export type AgentConfig = {
    actions: AgentAction[];
    aiEnabled: boolean;
    agentSpeed: AgentSpeed;
    metadata?: Record<string, unknown>;
};

export type AgentData = {
    id: string;
    name: string;
    description?: string;
    role: string;
    image?: string;
    tools?: any[];
    config: AgentConfig;
    capability: AgentCapability;
    parentNodeId?: string;
};
