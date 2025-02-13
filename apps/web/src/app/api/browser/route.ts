import { NextResponse } from 'next/server';
import { chromium } from '@playwright/test';

// Set edge runtime to false since we need Node.js features
export const runtime = 'nodejs';

export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        // Validate URL
        try {
            const parsedUrl = new URL(url);
            if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
                throw new Error('Invalid URL protocol');
            }
        } catch {
            return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
        }

        // Launch browser and navigate
        const browser = await chromium.launch({ headless: false });
        const context = await browser.newContext();
        const page = await context.newPage();

        await page.goto(url, { waitUntil: 'domcontentloaded' });
        
        // Wait briefly to show the page
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Clean up
        await context.close();
        await browser.close();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Browser automation error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
