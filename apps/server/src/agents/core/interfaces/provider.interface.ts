import { IAgent } from './agent.interface';
import { IAgentConfig } from './agent.interface';
import { ITool } from './tool.interface';

export interface AgentProvider<TContext = unknown, TResult = unknown> {
    createAgent(config: IAgentConfig, tools: ITool<TContext, TResult>[]): Promise<IAgent<TContext, TResult>>;
    validateConfig(config: IAgentConfig): boolean;
}

export class AgentProviderFactory {
    static create<TContext = unknown, TResult = unknown>(providerType: 'langchain' | 'praisonai'): AgentProvider<TContext, TResult> {
        switch (providerType) {
            case 'langchain':
                return new LangChainProvider<TContext, TResult>();
            case 'praisonai':
                return new PraisonAIProvider<TContext, TResult>();
            default:
                throw new Error(`Unsupported provider type: ${providerType}`);
        }
    }
}

class LangChainProvider<TContext = unknown, TResult = unknown> implements AgentProvider<TContext, TResult> {
    async createAgent(config: IAgentConfig, tools: ITool<TContext, TResult>[]): Promise<IAgent<TContext, TResult>> {
        throw new Error('LangChain provider not implemented');
    }

    validateConfig(config: IAgentConfig): boolean {
        return !!config.name && (config.maxConcurrency || 1) > 0;
    }
}

class PraisonAIProvider<TContext = unknown, TResult = unknown> implements AgentProvider<TContext, TResult> {
    async createAgent(config: IAgentConfig, tools: ITool<TContext, TResult>[]): Promise<IAgent<TContext, TResult>> {
        throw new Error('PraisonAI provider not implemented');
    }

    validateConfig(config: IAgentConfig): boolean {
        return !!config.name && (config.maxConcurrency || 1) > 0;
    }
}
