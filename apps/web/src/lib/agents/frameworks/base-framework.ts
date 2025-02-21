import { IModelProvider } from '../model-providers/base-model';
import { Task, Result, FrameworkError } from '../types';

export interface IAgentFramework {
    initialize(model: IModelProvider): Promise<void>;
    execute(task: Task): Promise<Result>;
    stream(task: Task): AsyncGenerator<Result>;
    cleanup(): Promise<void>;
}

export abstract class BaseAgentFramework implements IAgentFramework {
    protected model: IModelProvider | null = null;
    protected initialized: boolean = false;

    async initialize(model: IModelProvider): Promise<void> {
        if (this.initialized) {
            return;
        }

        try {
            this.model = model;
            await this.setupFramework();
            this.initialized = true;
        } catch (error) {
            throw new FrameworkError(
                'Failed to initialize framework',
                { error: error instanceof Error ? error.message : 'Unknown error' }
            );
        }
    }

    abstract execute(task: Task): Promise<Result>;
    abstract stream(task: Task): AsyncGenerator<Result>;

    async cleanup(): Promise<void> {
        this.model = null;
        this.initialized = false;
    }

    protected abstract setupFramework(): Promise<void>;

    protected validateInitialization(): void {
        if (!this.initialized || !this.model) {
            throw new FrameworkError('Framework not initialized');
        }
    }
}
