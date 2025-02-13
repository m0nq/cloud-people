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

export type AgentConfig = {
    actions: AgentAction[];
    aiEnabled: boolean;
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
