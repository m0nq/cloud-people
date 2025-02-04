import { Browser } from 'playwright';
import { Page } from 'playwright';
import { chromium } from 'playwright';

import { IAgent } from '@agents/core/interfaces/agent.interface';
import { AgentStatus } from '@agents/core/interfaces/agent.interface';
import { AgentError } from '@agents/core/interfaces/agent.interface';
import { IAgentState } from '@agents/core/interfaces/agent.interface';
import { BrowserChain } from './browser.chain';
import { ExecutionMetrics } from '@shared/metrics/metrics-collector';

export interface BrowserContext {
	currentUrl: string;
	pageTitle: string;
	cookies: Record<string, string>;
	localStorage: Record<string, string>;
}

export interface ExecutionHistory {
	timestamp: Date;
	success: boolean;
	result: string | null;
	error: AgentError | undefined;
	status: AgentStatus;
	metrics: ExecutionMetrics;
}

export interface IAgentResponse<T> {
	success: boolean;
	result: T;
	metrics: ExecutionMetrics;
}

export class BrowserAgent implements IAgent<BrowserContext, string> {
	private browser: Browser | null = null;
	private page: Page | null = null;
	private chain: BrowserChain;
	private state: IAgentState<BrowserContext> = {
		status: AgentStatus.IDLE,
		context: {
			currentUrl: '',
			pageTitle: '',
			cookies: {},
			localStorage: {}
		},
		history: [] as ExecutionHistory[]
	};

	private config = {
		maxRetries: 3,
		retryDelay: 1000,
		screenshotOnError: true,
		headless: true,
		timeout: 30000
	};

	constructor(config?: Partial<typeof BrowserAgent.prototype.config>) {
		this.chain = new BrowserChain();
		if (config) {
			this.config = { ...this.config, ...config };
		}
	}

	async initialize(): Promise<void> {
		this.browser = await chromium.launch({
			headless: this.config.headless
		});

		this.page = await this.browser.newPage();
		await this.chain.initialize(this.browser, this.page);
		this.state.status = AgentStatus.IDLE;
	}

	private recordHistory(success: boolean, result?: string, error?: AgentError, instruction?: string): ExecutionHistory {
		const now = new Date();
		return {
			timestamp: now,
			success,
			result: result ?? null,
			error: error ?? undefined,
			status: this.state.status,
			metrics: {
				executionId: crypto.randomUUID(),
				startTime: now.getTime(),
				endTime: now.getTime(),
				instruction: instruction ?? 'No instruction provided'
			}
		};
	}

	async execute(instruction: string): Promise<{ success: boolean; result: string; metrics: ExecutionMetrics }> {
		if (!this.browser || !this.page) {
			throw new Error('Browser not initialized. Call initialize() first.');
		}

		this.state.status = AgentStatus.RUNNING;
		const startTime = new Date().getTime();
		try {
			const result = await this.chain.executeTask(instruction);
			await this.updateState();
			this.state.status = AgentStatus.IDLE;
			this.state.history.push(this.recordHistory(true, result, undefined, instruction));
			return {
				success: true,
				result,
				metrics: {
					executionId: crypto.randomUUID(),
					startTime,
					endTime: new Date().getTime(),
					instruction
				}
			};
		} catch (error) {
			const agentError = this.handleError(error);
			this.state.status = AgentStatus.ERROR;
			this.state.history.push(this.recordHistory(false, undefined, agentError, instruction));
			return {
				success: false,
				result: agentError.message,
				metrics: {
					executionId: crypto.randomUUID(),
					startTime,
					endTime: new Date().getTime(),
					instruction
				}
			};
		}
	}

	private async updateState(): Promise<void> {
		if (!this.page) return;

		const [cookies, localStorage] = await Promise.all([
			this.page.context().cookies(),
			this.page.evaluate(() => {
				const items: Record<string, string> = {};
				for (let i = 0; i < window.localStorage.length; i++) {
					const key = window.localStorage.key(i);
					if (key) {
						items[key] = window.localStorage.getItem(key) || '';
					}
				}
				return items;
			})
		]);

		this.state.context = {
			currentUrl: this.page.url(),
			pageTitle: await this.page.title(),
			cookies: cookies.reduce(
				(acc, cookie) => {
					acc[cookie.name] = cookie.value;
					return acc;
				},
				{} as Record<string, string>
			),
			localStorage
		};
	}

	getState(): IAgentState<BrowserContext> {
		return this.state;
	}

	async cleanup(): Promise<void> {
		await this.chain.cleanup();
		this.state.status = AgentStatus.IDLE;
	}

	private handleError(error: any): AgentError {
		const agentError: AgentError = {
			code: 'BROWSER_ERROR',
			message: error instanceof Error ? error.message : String(error)
		};
		return agentError;
	}
}
