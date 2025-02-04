import { IAgent } from './interfaces/agent.interface';
import { IAgentConfig } from './interfaces/agent.interface';
import { ITool } from './interfaces/tool.interface';
import { AgentProvider } from './interfaces/provider.interface';
import { AgentProviderFactory } from './interfaces/provider.interface';
import { MetricsCollector } from '@shared/metrics/metrics-collector';

export class AgentBuilder<TContext = unknown, TResult = unknown> {
    private provider: AgentProvider<TContext, TResult>;
    private tools: ITool<TContext, TResult>[] = [];
    private config: Partial<IAgentConfig> = {};
    private metricsCollector: MetricsCollector | null = null;

    constructor(providerType: 'langchain' | 'praisonai') {
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

    async build(): Promise<IAgent<TContext, TResult>> {
        const fullConfig: IAgentConfig = {
            name: 'default',
            maxConcurrency: 1,
            timeout: 30000,
            ...this.config,
            tools: this.tools
        };

        if (!this.provider.validateConfig(fullConfig)) {
            throw new Error('Invalid agent configuration');
        }

        const agent = await this.provider.createAgent(fullConfig, this.tools);
        return this.wrapWithMetrics(agent as IAgent<TContext, TResult>);
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
