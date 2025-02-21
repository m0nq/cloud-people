import { AgentState } from '@app-types/agent';
import { AgentConfig, AgentConfigSchema, Task, Result, AgentError } from './types';
import { IModelProvider } from './model-providers/base-model';
import { IAgentFramework } from './frameworks/base-framework';

export abstract class BaseAgent {
    protected state: AgentState = AgentState.Initial;
    protected model: IModelProvider | null = null;
    protected framework: IAgentFramework | null = null;

    constructor(protected config: AgentConfig) {
        this.validateConfig();
    }

    protected validateConfig(): void {
        try {
            AgentConfigSchema.parse(this.config);
        } catch (error) {
            throw new AgentError(
                'Invalid agent configuration',
                { error: error instanceof Error ? error.message : 'Unknown error' }
            );
        }
    }

    async initialize(): Promise<void> {
        if (this.state !== AgentState.Initial) {
            throw new AgentError('Agent already initialized');
        }

        try {
            this.state = AgentState.Activating;
            
            // Initialize model provider
            this.model = await this.createModelProvider();
            await this.model.initialize();

            // Initialize framework
            this.framework = await this.createFramework();
            await this.framework.initialize(this.model);

            this.state = AgentState.Idle;
        } catch (error) {
            this.state = AgentState.Error;
            throw new AgentError(
                'Failed to initialize agent',
                { error: error instanceof Error ? error.message : 'Unknown error' }
            );
        }
    }

    async execute(task: Task): Promise<Result> {
        if (this.state !== AgentState.Idle) {
            throw new AgentError('Agent not ready for execution');
        }

        try {
            this.state = AgentState.Working;
            const result = await this.framework!.execute(task);
            this.state = AgentState.Idle;
            return result;
        } catch (error) {
            this.state = AgentState.Error;
            throw new AgentError(
                'Failed to execute task',
                { error: error instanceof Error ? error.message : 'Unknown error' }
            );
        }
    }

    async *stream(task: Task): AsyncGenerator<Result> {
        if (this.state !== AgentState.Idle) {
            throw new AgentError('Agent not ready for streaming');
        }

        try {
            this.state = AgentState.Working;
            const stream = this.framework!.stream(task);

            for await (const chunk of stream) {
                yield chunk;
            }

            this.state = AgentState.Idle;
        } catch (error) {
            this.state = AgentState.Error;
            throw new AgentError(
                'Failed to stream task execution',
                { error: error instanceof Error ? error.message : 'Unknown error' }
            );
        }
    }

    async cleanup(): Promise<void> {
        try {
            if (this.framework) {
                await this.framework.cleanup();
                this.framework = null;
            }

            if (this.model) {
                await this.model.cleanup();
                this.model = null;
            }

            this.state = AgentState.Initial;
        } catch (error) {
            this.state = AgentState.Error;
            throw new AgentError(
                'Failed to cleanup agent',
                { error: error instanceof Error ? error.message : 'Unknown error' }
            );
        }
    }

    getState(): AgentState {
        return this.state;
    }

    protected abstract createModelProvider(): Promise<IModelProvider>;
    protected abstract createFramework(): Promise<IAgentFramework>;
}
