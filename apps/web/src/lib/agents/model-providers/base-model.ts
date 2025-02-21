import { ModelConfig } from '../types';
import { ModelError } from '../types';

export interface ModelResponse {
    content: string | { type: string; text: string }[];
    metadata?: Record<string, unknown>;
}

export interface IModelProvider {
    initialize(): Promise<void>;
    generate(input: string): Promise<ModelResponse>;
    stream(input: string): AsyncGenerator<ModelResponse>;
    cleanup(): Promise<void>;
}

export abstract class BaseModelProvider implements IModelProvider {
    protected config: ModelConfig;
    protected initialized: boolean = false;

    constructor(config: ModelConfig) {
        this.config = config;
    }

    abstract generate(input: string): Promise<ModelResponse>;
    abstract stream(input: string): AsyncGenerator<ModelResponse>;

    async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        try {
            await this.validateConfig();
            await this.setupProvider();
            this.initialized = true;
        } catch (error) {
            throw new ModelError(
                'Failed to initialize model provider',
                { 
                    provider: this.config.provider,
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            );
        }
    }

    async cleanup(): Promise<void> {
        this.initialized = false;
    }

    protected async validateConfig(): Promise<void> {
        if (!this.config.provider) {
            throw new ModelError('Model provider not specified');
        }

        if (!this.config.name) {
            throw new ModelError('Model name not specified');
        }
    }

    protected abstract setupProvider(): Promise<void>;
}
