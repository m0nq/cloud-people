import { z } from 'zod';
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { AgentFactory } from '@/lib/agents/agent-factory';
import { AgentData } from '@app-types/agent/config';

// Configure runtime
export const runtime = 'nodejs';
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
    try {
        // Validate request
        const body = await req.json();
        const validatedBody = requestSchema.parse(body);
        const { message, agentData } = validatedBody;

        // Create orchestrator
        const orchestrator = AgentFactory.createAgent(agentData);

        try {
            // Initialize task execution
            const result = await orchestrator.executeTask({
                id: crypto.randomUUID(),
                description: message.content,
                userId: req.headers.get('x-user-id'),
                tools: agentData.tools || [],
                context: {
                    agentId: agentData.id,
                    messageId: message.id
                }
            });

            return NextResponse.json(
                {
                    taskId: result.taskId,
                    status: result.status,
                    output: result.output,
                    error: result.error
                },
                { status: result.error ? 500 : 200 }
            );

        } catch (error) {
            console.error('Task execution failed:', error);
            return NextResponse.json(
                {
                    error: error instanceof Error ? error.message : 'Task execution failed'
                },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Request validation failed:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Invalid request'
            },
            { status: 400 }
        );
    }
};
