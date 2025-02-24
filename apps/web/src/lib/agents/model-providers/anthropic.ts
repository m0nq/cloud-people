import { ChatAnthropic } from '@langchain/anthropic';

import { BaseModelProvider } from './base-model';
import { ModelResponse } from './base-model';
import { ModelError } from '../types';

export class AnthropicProvider extends BaseModelProvider {
    private model: ChatAnthropic | null = null;

    protected async setupProvider(): Promise<void> {
        if (!this.config.apiKey) {
            throw new ModelError(
                'Anthropic API key not provided',
                { provider: 'anthropic' }
            );
        }

        try {
            this.model = new ChatAnthropic({
                anthropicApiKey: this.config.apiKey,
                modelName: this.config.name,
                ...this.config.parameters
            });
        } catch (error) {
            throw new ModelError(
                'Failed to initialize Anthropic model',
                { 
                    provider: 'anthropic',
                    model: this.config.name,
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            );
        }
    }

    async generate(input: string): Promise<ModelResponse> {
        if (!this.model) {
            throw new ModelError('Model not initialized');
        }

        try {
            const response = await this.model.invoke(input);
            if (typeof response.content === 'object') {
                return {
                    content: JSON.stringify(response.content),
                    metadata: {
                        model: this.config.name,
                        provider: 'anthropic'
                    }
                };
            } else {
                return {
                    content: response.content,
                    metadata: {
                        model: this.config.name,
                        provider: 'anthropic'
                    }
                };
            }
        } catch (error) {
            throw new ModelError(
                'Failed to generate response',
                {
                    provider: 'anthropic',
                    model: this.config.name,
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            );
        }
    }

    async *stream(input: string): AsyncGenerator<ModelResponse> {
        if (!this.model) {
            throw new ModelError('Model not initialized');
        }

        try {
            const stream = await this.model.stream(input);
            
            for await (const chunk of stream) {
                if (typeof chunk.content === 'object') {
                    yield {
                        content: JSON.stringify(chunk.content),
                        metadata: {
                            model: this.config.name,
                            provider: 'anthropic',
                            isPartial: true
                        }
                    };
                } else {
                    yield {
                        content: chunk.content,
                        metadata: {
                            model: this.config.name,
                            provider: 'anthropic',
                            isPartial: true
                        }
                    };
                }
            }
        } catch (error) {
            throw new ModelError(
                'Failed to stream response',
                {
                    provider: 'anthropic',
                    model: this.config.name,
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            );
        }
    }

    async cleanup(): Promise<void> {
        this.model = null;
        await super.cleanup();
    }
}
