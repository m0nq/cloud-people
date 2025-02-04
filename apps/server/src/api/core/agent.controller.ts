import { Request } from 'express';
import { Response } from 'express';

import { AgentBuilder } from '@agents/core/agent-builder';
import { SystemAgentType } from '@agents/core/agent-builder';
import { IAgent } from '@agents/core/interfaces/agent.interface';

export class AgentController {
	private agentCache: Map<string, IAgent> = new Map();

	async executeTask(req: Request, res: Response): Promise<void> {
		try {
			const {
				agentType,
				providerType = 'praisonai',
				instruction,
				config = {}
			} = req.body;

			if (!agentType) {
				res.status(400).json({ error: 'Missing agentType in request body' });
				return;
			}

			if (!instruction) {
				res.status(400).json({ error: 'Missing instruction in request body' });
				return;
			}

			// Validate agent type
			if (!this.isValidAgentType(agentType)) {
				res.status(400).json({ error: `Unsupported agent type: ${agentType}` });
				return;
			}

			// Cache key combines agent type and provider
			const cacheKey = `${agentType}-${providerType}`;
			let agent = this.agentCache.get(cacheKey);

			if (!agent) {
				const builder = new AgentBuilder(agentType as SystemAgentType, providerType);
				agent = await builder.withConfig(config).build();
				this.agentCache.set(cacheKey, agent);
			}

			await agent.initialize();
			const result = await agent.execute(instruction);
			await agent.cleanup();

			res.json(result);
		} catch (error) {
			console.error('Error executing agent task:', error);
			res.status(500).json({
				error: error instanceof Error ? error.message : 'Unknown error occurred'
			});
		}
	}

	private isValidAgentType(type: string): type is SystemAgentType {
		return ['browser'].includes(type); // Add more types as they are implemented
	}
}
