import { AgentData } from '@app-types/agent/config';
import { BaseAgent } from './base-agent';
import { BrowserAgent } from './browser-agent';
import { FrameworkType } from '@lib/agents/types';

export class AgentFactory {
    static createAgent(agentData: AgentData): BaseAgent {
        // Create agent configuration based on AgentData
        const config = {
            id: agentData.id,
            name: agentData.name,
            description: agentData.description || '',
            model: {
                provider: 'anthropic', // This could come from agentData.models
                name: agentData.model, // Using first model for now
                parameters: {
                    contextWindow: agentData.contextWindow,
                    memoryLimit: agentData.memoryLimit,
                    speed: agentData.speed
                }
            },
            framework: {
                type: FrameworkType.langgraph,
                options: {}
            },
            tools:
                agentData.tools?.map((tool) => ({
                    name: tool,
                    description: `Tool for ${tool}`,
                    actions: {} // This would need to be populated based on tool capabilities
                })) || []
        };

        // Create the appropriate agent type based on tools and capabilities
        if (agentData.tools?.includes('browser')) {
            return new BrowserAgent(config);
        }

        // Add more agent types here as needed
        // if (agentData.tools?.includes('database')) {
        //     return new DatabaseAgent(config);
        // }

        throw new Error(
            `Unable to create agent with tools: ${agentData.tools?.join(', ')}`
        );
    }
}
