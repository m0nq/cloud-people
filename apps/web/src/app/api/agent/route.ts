import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { type NextRequest } from 'next/server';

// This line sets the runtime environment for the API route to 'edge'
// Edge runtime offers faster cold starts and lower latency compared to the Node.js runtime
// It's ideal for API routes that require quick response times and don't need access to Node.js-specific APIs
export const runtime = 'edge';

const anthropic = createAnthropic({
    // custom settings
    apiKey: process.env.ANTHROPIC_API_KEY
});

export async function POST(req: NextRequest) {
    const { messages, action } = await req.json();

    console.log('messages', messages);
    console.log('action', action);

    // Generate text using the AI SDK
    const { text } = await generateText({
        model: anthropic('claude-3-5-haiku-latest'),
        // prompt: 'Write a vegetarian lasagna recipe for 4 people.',
        messages: [
            {
                role: 'system',
                content: `You are an AI agent that can perform actions. Your current action is: ${action}.
                             Respond with clear, step-by-step descriptions of what you're doing.`
            },
            ...messages
        ],
        temperature: 0.5,
        maxTokens: 1000
    });

    // Return the stream response
    return Response.json(text);
}
