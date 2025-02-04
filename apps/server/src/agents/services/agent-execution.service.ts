import { WebSocket } from 'ws';
import { WebSocketServer } from 'ws';
import { Server } from 'http';

import { AgentBuilder } from '@agents/core/agent-builder';
import { AgentDefinitionRepository } from '@agents/infrastructure/agent-definition.repository';
import { AgentExecutionState } from '@agents/types/agent-definition.types';

export class AgentExecutionService {
	private wsServer: WebSocketServer;
	private executionStates: Map<string, AgentExecutionState> = new Map();

	constructor(
		httpServer: Server,
		private agentDefinitionRepo: AgentDefinitionRepository
	) {
		this.wsServer = new WebSocketServer({ server: httpServer });
		this.setupWebSocket();
	}

	private setupWebSocket() {
		this.wsServer.on('connection', (ws, req) => {
			const executionId = new URL(req.url!, `http://${req.headers.host}`).searchParams.get('executionId');
			if (!executionId) {
				ws.close(1002, 'Missing executionId');
				return;
			}

			// Send initial state if exists
			const state = this.executionStates.get(executionId);
			if (state) {
				ws.send(JSON.stringify(state));
			}

			ws.on('message', async message => {
				try {
					const { type, data } = JSON.parse(message.toString());
					switch (type) {
						case 'START_EXECUTION':
							await this.startExecution(executionId, data, ws as unknown as WebSocket);
							break;
						case 'CANCEL_EXECUTION':
							await this.cancelExecution(executionId);
							break;
					}
				} catch (error) {
					ws.send(
						JSON.stringify({
							type: 'ERROR',
							error: error instanceof Error ? error.message : 'Unknown error'
						})
					);
				}
			});
		});
	}

	private async startExecution(
		executionId: string,
		data: { agentId?: string; agentType?: string; instruction: string; config?: any },
		ws: WebSocket
	) {
		try {
			// Update execution state
			const state: AgentExecutionState = {
				status: 'initializing',
				metrics: {
					startTime: new Date(),
					toolsUsed: []
				}
			};
			this.executionStates.set(executionId, state);
			ws.send(JSON.stringify(state));

			// Create appropriate agent
			const builder = new AgentBuilder();

			if (data.agentId) {
				// Dynamic agent
				const definition = await this.agentDefinitionRepo.getAgentById(data.agentId);
				if (!definition) {
					throw new Error(`Agent not found: ${data.agentId}`);
				}
				builder.withAgentDefinition(definition);
			} else if (data.agentType) {
				// System agent
				builder.withAgentDefinition({
					id: data.agentType,
					name: data.agentType,
					description: `System agent of type ${data.agentType}`,
					created_by: 'system',
					is_system: true,
					tools: [],
					default_config: {},
					metadata: {
						capabilities: [],
						constraints: {}
					},
					created_at: new Date(),
					updated_at: new Date()
				});
			} else {
				throw new Error('Either agentId or agentType must be provided');
			}

			if (data.config) {
				builder.withConfig(data.config);
			}

			const agent = await builder.build();

			// Execute with progress updates
			state.status = 'running';
			ws.send(JSON.stringify(state));

			await agent.initialize();
			const result = await agent.execute(data.instruction);
			await agent.cleanup();

			// Update final state
			state.status = 'completed';
			state.result = result;
			state.metrics!.endTime = new Date();
			state.metrics!.duration = state.metrics!.endTime.getTime() - state.metrics!.startTime.getTime();

			this.executionStates.set(executionId, state);
			ws.send(JSON.stringify(state));
		} catch (error) {
			const errorState: AgentExecutionState = {
				status: 'error',
				error: error instanceof Error ? error.message : 'Unknown error',
				metrics: {
					startTime: new Date(),
					endTime: new Date(),
					toolsUsed: []
				}
			};
			this.executionStates.set(executionId, errorState);
			ws.send(JSON.stringify(errorState));
		}
	}

	private async cancelExecution(executionId: string) {
		// Implement cancellation logic
		const state = this.executionStates.get(executionId);
		if (state) {
			state.status = 'error';
			state.error = 'Execution cancelled by user';
			this.executionStates.set(executionId, state);
		}
	}
}
