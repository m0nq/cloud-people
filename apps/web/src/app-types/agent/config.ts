export type AgentAction = {
    type: 'browser';
    command: 'navigate' | 'close';
    url?: string;
    params?: Record<string, string>;
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

export type AgentData = {
    id: string;
    name: string;
    description: string;
    image?: string;
    speed: AgentSpeed;
    memoryLimit: MemoryLimit;
    contextWindow?: string;
    budget: string;
    models: string[];
    tools?: string[];
    createdBy: string;
    parentNodeId?: string;
    // Browser-use specific fields
    url?: string;
    browserOptions?: {
        waitForSelector?: string;
        timeout?: number;
        screenshot?: boolean;
        viewport?: {
            width: number;
            height: number;
        };
    };
};

export type AgentConfig = {
    actions: AgentAction[];
    aiEnabled: boolean;
    agentSpeed: AgentSpeed;
    metadata?: Record<string, unknown>;
};
