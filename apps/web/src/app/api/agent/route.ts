import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { type NextRequest } from 'next/server';
import { z } from 'zod';

// Set runtime to nodejs since we need Node.js features for browser automation
export const runtime = 'nodejs';

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

export async function POST(req: NextRequest) {
    try {
        // Parse and validate request body
        const body = await req.json();
        console.log('Received request body:', body);
        const validatedBody = requestSchema.parse(body);
        const { messages, action, parameters, agentId } = validatedBody;

        console.log('Generating AI response...');
        console.log('Action...', action);
        console.log('Messages...', messages);
        console.log('parameters...', parameters);
        console.log('agentId...', agentId);
        // Generate AI response
        const result = streamText({
            model: anthropic('claude-3-opus-20240229'),
            messages: [
                {
                    role: 'system',
                    content: `You are an AI agent that helps users navigate to websites. 
                    When asked to navigate to a website, use the navigateToUrl tool to open it in a new tab.
                    If no specific URL is provided, use your best judgment to determine the most relevant URL.
                    For example, if asked to "go to Google", use "https://www.google.com".`
                },
                ...messages
            ],
            tools: {
                navigateToUrl: {
                    description: 'Navigate to a specified URL in a new browser tab',
                    parameters: z.object({
                        url: z.string().describe('The URL to navigate to')
                    })
                }
            }
        });

        console.log('AI response:', result);

        // Let the client handle tool execution
        return result.toDataStreamResponse();

    } catch (error) {
        console.error('Agent API error:', error);
        return Response.json({
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
