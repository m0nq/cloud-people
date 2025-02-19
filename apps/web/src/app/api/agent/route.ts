import { z } from 'zod';
import { ChatAnthropic } from '@langchain/anthropic';
import { BaseMessage } from '@langchain/core/messages';
import { AIMessage } from '@langchain/core/messages';
import { ChatMessage } from '@langchain/core/messages';
import { HumanMessage } from '@langchain/core/messages';
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Message } from 'ai';
import { chromium } from 'playwright';

// Configure runtime
export const runtime = 'nodejs';

const model = new ChatAnthropic({
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    modelName: 'claude-3-opus-20240229'
});

// Schema for validating request body
const requestSchema = z.object({
    message: z.object({
        id: z.string(),
        role: z.enum(['system', 'user', 'assistant', 'data']),
        content: z.string()
    })
});

const convertVercelMessageToLangChainMessage = (message: Message) => {
    if (message.role === 'user') {
        return new HumanMessage(message.content);
    } else if (message.role === 'assistant') {
        return new AIMessage(message.content);
    } else {
        return new ChatMessage(message.content, message.role);
    }
};

const convertLangChainMessageToVercelMessage = (message: BaseMessage) => {
    if (message._getType() === 'human') {
        return { content: message.content, role: 'user' };
    } else if (message._getType() === 'ai') {
        return {
            content: message.content,
            role: 'assistant',
            tool_calls: (message as AIMessage).tool_calls
        };
    } else {
        return { content: message.content, role: message._getType() };
    }
};

export const POST = async (req: NextRequest): Promise<NextResponse> => {
    const body = await req.json();
    const validatedBody = requestSchema.parse(body);
    const { message } = validatedBody;
    const convertedMessage = convertVercelMessageToLangChainMessage({ ...message });
    console.log('Converted message ->', convertedMessage);

    let browser;
    try {
        // Launch browser
        browser = await chromium.launch({
            headless: false // Set to true in production
        });

        // Create a new browser context
        const context = await browser.newContext({
            viewport: { width: 1280, height: 720 },
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        });

        // Create a new page
        const page = await context.newPage();

        // Example navigation (replace with your actual task logic)
        await page.goto('https://google.com');
        const title = await page.title();

        // Get page content for AI analysis
        const content = await page.content();

        // Use LangChain to analyze and decide next steps
        const result = await model.invoke([
            new HumanMessage({
                content: `Task: ${message.content}\nCurrent page title: ${title}\nAnalyze the current state and suggest next steps.`
            })
        ]);

        // Clean up
        await context.close();
        await browser.close();

        return NextResponse.json({ result: result.content }, { status: 200 });
    } catch (error: any) {
        console.error('Agent API error:', error);

        // Add specific error handling
        if (error.name === 'TimeoutError') {
            return NextResponse.json({ error: 'Task timed out' }, { status: 408 });
        }

        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'An unknown error occurred',
                agentId: message.id
            },
            { status: 500 }
        );
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};
