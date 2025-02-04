import { Browser } from 'playwright';
import { Page } from 'playwright';
import { Anthropic } from '@anthropic-ai/sdk';

import { ToolRegistry } from '@agents/core/tool-registry';
import { BrowserTools } from '@agents/tools/browser.tools';

export class BrowserChain {
	private browser: Browser | null = null;
	private page: Page | null = null;
	private model: Anthropic;
	private toolRegistry: ToolRegistry;

	constructor() {
		this.model = new Anthropic({
			apiKey: process.env.ANTHROPIC_API_KEY
		});
		this.toolRegistry = ToolRegistry.getInstance();
		this.registerBrowserTools();
	}

	private registerBrowserTools(): void {
		const browserTools = new BrowserTools(this);
		Object.values(browserTools.getTools()).forEach(tool => {
			this.toolRegistry.registerTool(tool);
		});
	}

	async initialize(browser: Browser, page: Page): Promise<void> {
		this.browser = browser;
		this.page = page;

		// Set up default browser behaviors
		if (this.page) {
			await this.page.setViewportSize({ width: 1280, height: 800 });
			await this.page.setDefaultTimeout(30000);
			await this.page.setDefaultNavigationTimeout(30000);
		}
	}

	async executeTask(instruction: string): Promise<string> {
		if (!this.page) throw new Error('Browser page not initialized');

		const message = await this.model.messages.create({
			model: 'claude-3-opus-20240229',
			messages: [
				{
					role: 'user',
					content: `Given these browser automation tools:\n${this.getAvailableTools()}\n\nCreate a plan to: ${instruction}`
				}
			],
			max_tokens: 1024
		});

		// Anthropic SDK returns content as an array of blocks, we want the text content
		const content = message.content[0].type === 'text' ? message.content[0].text : '';
		const plan = this.parsePlan(content);
		return this.executePlan(plan);
	}

	private getAvailableTools(): string {
		return this.toolRegistry
			.getToolsByCategory('browser')
			.map(tool => `${tool.name}: ${tool.description}`)
			.join('\n');
	}

	private parsePlan(response: string): Array<{ tool: string; params: Record<string, unknown> }> {
		// Simple parsing for now - in reality, you'd want more robust parsing
		try {
			return JSON.parse(response);
		} catch {
			throw new Error('Failed to parse AI response into executable plan');
		}
	}

	private async executePlan(plan: Array<{ tool: string; params: Record<string, unknown> }>): Promise<string> {
		const results: string[] = [];

		for (const step of plan) {
			const tool = this.toolRegistry.getTool(step.tool);
			if (!tool) {
				throw new Error(`Unknown tool: ${step.tool}`);
			}

			const validation = tool.validate?.(step.params);
			if (validation && !validation.valid) {
				throw new Error(`Invalid parameters for tool ${step.tool}: ${validation.errors?.join(', ')}`);
			}

			const result = await tool.execute(step.params);
			if (typeof result === 'string') {
				results.push(result);
			} else if (result && typeof result === 'object' && 'data' in result) {
				results.push(String(result.data));
			}
		}

		return results.join('\n');
	}

	// Browser Actions
	async goto(url: string): Promise<void> {
		if (!this.page) throw new Error('Browser page not initialized');
		await this.page.goto(url, { waitUntil: 'networkidle' });
	}

	async click(selector: string): Promise<void> {
		if (!this.page) throw new Error('Browser page not initialized');
		await this.page.click(selector);
	}

	async type(selector: string, text: string): Promise<void> {
		if (!this.page) throw new Error('Browser page not initialized');
		await this.page.fill(selector, text);
	}

	async evaluate<T>(script: string): Promise<T> {
		if (!this.page) throw new Error('Browser page not initialized');
		return this.page.evaluate(script);
	}

	async waitForSelector(selector: string): Promise<void> {
		if (!this.page) throw new Error('Browser page not initialized');
		await this.page.waitForSelector(selector);
	}

	async getCurrentUrl(): Promise<string> {
		if (!this.page) throw new Error('Browser page not initialized');
		return this.page.url();
	}

	async getPageTitle(): Promise<string> {
		if (!this.page) throw new Error('Browser page not initialized');
		return this.page.title();
	}

	async cleanup(): Promise<void> {
		if (this.page) {
			await this.page.close();
			this.page = null;
		}
		if (this.browser) {
			await this.browser.close();
			this.browser = null;
		}
	}
}
