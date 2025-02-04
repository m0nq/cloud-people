import { Request } from 'express';
import { Response } from 'express';

import { AgentController } from '@api/core/agent.controller';

export class BrowserController extends AgentController {
	async executeTask(req: Request, res: Response): Promise<void> {
		// Add browser-specific config
		req.body = {
			...req.body,
			agentType: 'browser',
			providerType: 'praisonai',
			config: {
				...req.body.config,
				headless: process.env.NODE_ENV === 'production',
				screenshotOnError: true
			}
		};

		// Use base controller execution
		await super.executeTask(req, res);
	}
}
