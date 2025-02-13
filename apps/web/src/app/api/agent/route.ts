import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { tool } from 'ai';
import { type NextRequest } from 'next/server';
import { z } from 'zod';

// This line sets the runtime environment for the API route to 'edge'
// Edge runtime is required for AI SDK tools
export const runtime = 'edge';

const anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

// Schema for validating request body
const requestSchema = z.object({
    messages: z.array(z.any()),
    action: z.string(),
    parameters: z.record(z.string(), z.any()).optional(),
    agentId: z.string(),
    currentProgress: z.number().optional(),
    assistanceMessage: z.string().optional(),
    error: z.string().optional()
});

// Schema for browser action response
const browserActionResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    action: z.object({
        type: z.string(),
        command: z.string(),
        url: z.string()
    }).optional(),
    error: z.string().optional()
});

const browserTools = {
    navigateToGoogle: tool({
        description: 'Open a browser window and navigate to Google',
        parameters: z.object({}),
        execute: async () => {
            try {
                console.log('Executing navigateToGoogle tool...');
                // Since we're in an edge function, we can't directly control the browser
                // Instead, we'll return a command that the client can execute
                const response = {
                    success: true,
                    message: 'Navigate to Google',
                    action: {
                        type: 'browser',
                        command: 'navigate',
                        url: 'https://www.google.com'
                    }
                };
                console.log('Tool response:', response);
                return response;
            } catch (error) {
                console.error('Browser navigation failed:', error);
                return {
                    success: false,
                    message: 'Failed to navigate to Google',
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        }
    })
};

export async function POST(req: NextRequest) {
    try {
        // Parse and validate request body
        const body = await req.json();
        console.log('Received request body:', body);
        const validatedBody = requestSchema.parse(body);
        const { messages, action, parameters, agentId } = validatedBody;

        console.log('Generating AI response...');
        // Generate AI response
        const { text, toolCalls } = await generateText({
            model: anthropic('claude-3-haiku-latest'),
            messages: [
                {
                    role: 'system',
                    content: `You are an AI agent that can perform actions. Your current action is: ${action}.
                             When asked to navigate to Google, use the navigateToGoogle tool.
                             
                             Current agent state:
                             - Agent ID: ${agentId}
                             - Progress: ${validatedBody.currentProgress ?? 'N/A'}
                             - Assistance Message: ${validatedBody.assistanceMessage ?? 'None'}
                             - Previous Error: ${validatedBody.error ?? 'None'}`
                },
                ...messages
            ],
            tools: browserTools,
            temperature: 0.5,
            maxTokens: 1000
        });

        console.log('AI response:', { text, toolCalls });

        // Handle tool calls if any
        let toolResponse;
        if (toolCalls && toolCalls.length > 0) {
            console.log('Processing tool calls:', toolCalls);
            const toolCall = toolCalls[0]; // Handle first tool call
            if (toolCall.toolName === 'navigateToGoogle') {
                console.log('Executing navigateToGoogle tool...');
                const response = await browserTools.navigateToGoogle.execute({}, {
                    toolCallId: toolCall.toolCallId,
                    messages: messages,
                    abortSignal: req.signal
                });
                const validatedResponse = browserActionResponseSchema.parse(response);

                if (!validatedResponse.success) {
                    console.error('Tool execution failed:', validatedResponse);
                    return Response.json({
                        text,
                        status: 'error',
                        error: validatedResponse.error || validatedResponse.message
                    }, { status: 500 });
                }

                toolResponse = validatedResponse;
                console.log('Tool response:', toolResponse);
            }
        }

        console.log('Sending final response:', { text, status: 'success', toolResponse });
        return Response.json({
            text,
            status: 'success',
            toolResponse
        });

    } catch (error) {
        console.error('Agent API error:', error);
        return Response.json({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
