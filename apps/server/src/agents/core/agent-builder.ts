import { IAgent } from './interfaces/agent.interface';
import { IAgentConfig } from './interfaces/agent.interface';
import { ITool } from './interfaces/tool.interface';
import { AgentProvider } from './interfaces/provider.interface';
import { AgentProviderFactory } from './interfaces/provider.interface';
import { MetricsCollector } from '@shared/metrics/metrics-collector';
import { BrowserAgent } from '@agents/browser/browser.agent';
import { DynamicAgent } from '@agents/dynamic/dynamic.agent';
import { AgentDefinition } from '@agents/types/agent-definition.types';
import { ToolRegistry } from './tool-registry';

// Predefined system agent types
export type SystemAgentType = 'browser';
export type AgentType = SystemAgentType | string;

export class AgentBuilder<TContext = unknown, TResult = unknown> {
    private provider: AgentProvider<TContext, TResult>;
    private tools: ITool<TContext, TResult>[] = [];
    private config: Partial<IAgentConfig> = {};
    private metricsCollector: MetricsCollector | null = null;
    private agentDefinition?: AgentDefinition;

    constructor(
        private agentType?: SystemAgentType,
        providerType: 'langchain' | 'praisonai' = 'praisonai'
    ) {
        this.provider = AgentProviderFactory.create<TContext, TResult>(providerType);
        this.metricsCollector = new MetricsCollector();
    }

    withConfig(config: Partial<IAgentConfig>): this {
        this.config = { ...this.config, ...config };
        return this;
    }

    withTool(tool: ITool<TContext, TResult>): this {
        this.tools.push(tool);
        return this;
    }

    withMetricsCollector(collector: MetricsCollector): this {
        this.metricsCollector = collector;
        return this;
    }

    withAgentDefinition(definition: AgentDefinition): this {
        this.agentDefinition = definition;
        return this;
    }

    async build(): Promise<IAgent<TContext, TResult>> {
        const filteredTools = this.tools.filter((tool): tool is ITool<TContext, TResult> => tool !== undefined);
        const fullConfig: IAgentConfig = {
            name: this.agentDefinition?.name || 'default',
            maxConcurrency: 1,
            timeout: 30000,
            ...this.config,
            tools: filteredTools
        };

        if (!this.provider.validateConfig(fullConfig)) {
            throw new Error('Invalid agent configuration');
        }

        let agent: IAgent<TContext, TResult>;

        if (this.agentDefinition) {
            // Create dynamic agent based on definition
            const toolRegistry = ToolRegistry.getInstance();
            const tools = (await Promise.all(
                this.agentDefinition.tools.map(toolId => toolRegistry.getTool(toolId))
            )).filter((tool): tool is ITool<unknown, unknown> => tool !== undefined);

            agent = new DynamicAgent(
                this.agentDefinition,
                tools,
                { ...this.agentDefinition.default_config, ...fullConfig }
            ) as unknown as IAgent<TContext, TResult>;
        } else if (this.agentType) {
            // Create predefined system agent
            switch (this.agentType) {
                case 'browser':
                    agent = new BrowserAgent(fullConfig) as unknown as IAgent<TContext, TResult>;
                    break;
                default:
                    throw new Error(`Unsupported system agent type: ${this.agentType}`);
            }
        } else {
            throw new Error('Either agentType or agentDefinition must be provided');
        }

        return this.wrapWithMetrics(agent);
    }

    private wrapWithMetrics(agent: IAgent<TContext, TResult>): IAgent<TContext, TResult> {
        const metricsCollector = this.metricsCollector;
        if (!metricsCollector) {
            return agent;
        }

        const originalExecute = agent.execute.bind(agent);
        agent.execute = async (instruction: string) => {
            const executionId = metricsCollector.startExecution();
            try {
                const result = await originalExecute(instruction);
                metricsCollector.recordSuccess(executionId, {
                    instruction,
                    duration: Date.now() - new Date().getTime()
                });
                metricsCollector.endExecution(executionId);
                return result;
            } catch (error) {
                metricsCollector.recordError(executionId, {
                    instruction,
                    error: error instanceof Error ? error : new Error(String(error))
                });
                metricsCollector.endExecution(executionId);
                throw error;
            }
        };

        return agent;
    }
}
