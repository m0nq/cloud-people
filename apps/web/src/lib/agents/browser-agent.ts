import { BaseAgent } from './base-agent';
import { IModelProvider } from './model-providers/base-model';
import { IAgentFramework } from './frameworks/base-framework';
import { AnthropicProvider } from './model-providers/anthropic';
import { LangGraphFramework } from './frameworks/langgraph';
import { AgentConfig } from './types';

export class BrowserAgent extends BaseAgent {
    constructor(config: AgentConfig) {
        super(config);
    }

    protected async createModelProvider(): Promise<IModelProvider> {
        return new AnthropicProvider({
            provider: this.config.model.provider,
            name: this.config.model.name,
            apiKey: process.env.ANTHROPIC_API_KEY,
            parameters: this.config.model.parameters
        });
    }

    protected async createFramework(): Promise<IAgentFramework> {
        return new LangGraphFramework();
    }
}
