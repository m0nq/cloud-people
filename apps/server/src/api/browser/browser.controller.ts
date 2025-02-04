import { Request } from 'express';
import { Response } from 'express';

import { BrowserAgent } from '@agents/browser/browser.agent';

export class BrowserController {
	private agent: BrowserAgent;

	constructor() {
		this.agent = new BrowserAgent({
			headless: false, // Set to false for development to see the browser
			screenshotOnError: true
		});
	}

	async executeTask(req: Request, res: Response): Promise<void> {
		try {
			if (!req.body.instruction) {
				res.status(400).json({ error: 'Missing instruction in request body' });
				return;
			}

			await this.agent.initialize();
			const result = await this.agent.execute(req.body.instruction);
			await this.agent.cleanup();

			res.json(result);
		} catch (error) {
			console.error('Error executing browser task:', error);
			res.status(500).json({
				error: error instanceof Error ? error.message : 'Unknown error occurred'
			});
		}
	}
}
