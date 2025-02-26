export interface ToolResponse {
    type: string;
    success: boolean;
    url?: string;
    error?: string;
}

export interface AgentResponse {
    toolResponses?: ToolResponse[];
}

export interface AgentToolCall {
    type: string;
    args?: Record<string, unknown>;
    url?: string;
}
