import { z } from 'zod';
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { AgentFactory } from '@/lib/agents/agent-factory';
import { AgentData } from '@app-types/agent/config';

// Configure runtime
export const runtime = 'nodejs';
// This line forces Next.js to use server-side rendering for this API route.
// It's needed because we're using the `playwright` library which is only available on the server.
// Without this, Next.js would try to render the page on the client, which would fail.
export const dynamic = 'force-dynamic';

// Schema for validating request body
const requestSchema = z.object({
    message: z.object({
        id: z.string(),
        role: z.enum(['system', 'user', 'assistant', 'data']),
        content: z.string()
    }),
    agentData: z.custom<AgentData>((data) => data !== null && typeof data === 'object')
});

export const POST = async (req: NextRequest): Promise<NextResponse> => {
    let messageId = 'unknown';
    
    try {
        const body = await req.json();
        const validatedBody = requestSchema.parse(body);
        const { message, agentData } = validatedBody;
        messageId = message.id;

        // Create appropriate agent based on AgentData
        const agent = AgentFactory.createAgent(agentData);
        await agent.initialize();

        try {
            // Execute the task
            const result = await agent.execute({
                id: crypto.randomUUID(),
                type: 'agent_task',
                input: {
                    task: message.content,
                    tools: agentData.tools
                }
            });

            return NextResponse.json(
                {
                    result: result.output.content,
                    metadata: result.output.metadata
                },
                { status: 200 }
            );
        } finally {
            // Always cleanup the agent
            await agent.cleanup();
        }
    } catch (error: any) {
        console.error('Agent API error:', error);

        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'An unknown error occurred',
                agentId: messageId
            },
            { status: 500 }
        );
    }
};
