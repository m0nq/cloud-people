'use server';

import { authCheck } from '@lib/actions/authentication-actions';
import type { QueryConfig } from '@app-types/api';
import { connectToDB } from '@lib/utils';

export const createAgent = async (config: QueryConfig = {}): Promise<any> => {
    const user = await authCheck();

    const createAgentMutation = `
        mutation CreateAgentMutation(
            $name: String!,
            $description: String,
            $config: JSON!,
            $createdBy: UUID!
        ) {
            collection: insertIntoAgentsCollection(objects: [{
                name: $name,
                description: $description,
                config: $config,
                created_by: $createdBy
            }]) {
                records {
                    id
                    name
                    description
                    config
                    created_at
                    updated_at
                    created_by
                }
            }
        }
    `;

    try {
        const [agent] = await connectToDB(createAgentMutation, {
            name: config.data?.config?.name,
            description: config.data?.config?.description,
            config: config.data?.config || {},
            createdBy: user.id
        });

        if (!agent?.id) {
            throw new Error('Failed to create agent');
        }

        // If tools are provided, create tool associations
        if (config.data?.tools?.length) {
            const createAgentToolsMutation = `
                mutation CreateAgentToolsMutation($objects: [AgentToolsInsertInput!]!) {
                    collection: insertIntoAgentToolsCollection(objects: $objects) {
                        records {
                            id
                            agent_id
                            tool_id
                            configuration
                        }
                    }
                }
            `;

            await connectToDB(createAgentToolsMutation, {
                objects: config.data.tools.map((tool: any) => ({
                    agent_id: agent.id,
                    tool_id: tool.id,
                    configuration: tool.configuration || {}
                }))
            });
        }

        return agent;
    } catch (error) {
        console.error('Failed to create agent:', error);
        throw error;
    }
};

export const fetchAgent = async (config: QueryConfig = {}): Promise<any> => {
    await authCheck();

    const fetchAgentQuery = `
        query AgentQuery($id: UUID!) {
            collection: agentsCollection(filter: { id: { eq: $id } }) {
                edges {
                    node {
                        id
                        config
                        created_at
                        updated_at
                    }
                }
            }
        }
    `;

    try {
        const [agent] = await connectToDB(fetchAgentQuery, {
            data: {
                id: config.data?.id
            }
        });

        return agent;
    } catch (error) {
        console.error('Failed to fetch agent:', error);
        throw error;
    }
};
