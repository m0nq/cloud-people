import { BaseAgentFramework } from './base-framework';
import { Task, Result, FrameworkError } from '../types';

export class LangGraphFramework extends BaseAgentFramework {
    protected async setupFramework(): Promise<void> {
        // TODO: Implement LangGraph specific setup
        // This will be implemented when we add LangGraph integration
    }

    async execute(task: Task): Promise<Result> {
        this.validateInitialization();

        try {
            const response = await this.model!.generate(JSON.stringify(task.input));
            const content = Array.isArray(response.content) 
                ? response.content.map(c => c.text).join('')
                : response.content;
            
            return {
                id: crypto.randomUUID(),
                taskId: task.id,
                output: {
                    content,
                    metadata: response.metadata
                }
            };
        } catch (error) {
            throw new FrameworkError(
                'Failed to execute task',
                {
                    taskId: task.id,
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            );
        }
    }

    async *stream(task: Task): AsyncGenerator<Result> {
        this.validateInitialization();

        try {
            const stream = this.model!.stream(JSON.stringify(task.input));
            
            for await (const chunk of stream) {
                const content = Array.isArray(chunk.content)
                    ? chunk.content.map(c => c.text).join('')
                    : chunk.content;

                yield {
                    id: crypto.randomUUID(),
                    taskId: task.id,
                    output: {
                        content,
                        metadata: {
                            ...chunk.metadata,
                            isPartial: true
                        }
                    }
                };
            }
        } catch (error) {
            throw new FrameworkError(
                'Failed to stream task execution',
                {
                    taskId: task.id,
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            );
        }
    }
}
