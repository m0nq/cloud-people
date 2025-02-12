import { chromium } from '@playwright/test';
import { Browser } from '@playwright/test';
import { BrowserContext } from '@playwright/test';

class BrowserService {
    private static instance: BrowserService;
    private browser: Browser | null = null;
    private contexts: Map<string, BrowserContext> = new Map();

    private constructor() {}

    static getInstance(): BrowserService {
        if (!BrowserService.instance) {
            BrowserService.instance = new BrowserService();
        }
        return BrowserService.instance;
    }

    async getBrowser(): Promise<Browser> {
        if (!this.browser) {
            this.browser = await chromium.launch({
                headless: false // For visibility during development
            });
        }
        return this.browser;
    }

    async getContext(id: string): Promise<BrowserContext> {
        if (!this.contexts.has(id)) {
            const browser = await this.getBrowser();
            const context = await browser.newContext({
                viewport: { width: 1280, height: 720 }
            });
            this.contexts.set(id, context);
        }
        return this.contexts.get(id)!;
    }

    async navigate(url: string, contextId: string): Promise<void> {
        try {
            // Validate URL
            const parsedUrl = new URL(url);
            if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
                throw new Error('Invalid URL protocol');
            }

            const context = await this.getContext(contextId);
            const page = await context.newPage();
            
            await page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });
        } catch (error) {
            console.error('Navigation error:', error);
            throw error;
        }
    }

    async closeContext(id: string): Promise<void> {
        const context = this.contexts.get(id);
        if (context) {
            await context.close();
            this.contexts.delete(id);
        }
    }

    async cleanup(): Promise<void> {
        // Convert iterator to array before iterating
        const contexts = Array.from(this.contexts.values());
        for (const context of contexts) {
            await context.close();
        }
        this.contexts.clear();
        
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}

export const browserService = BrowserService.getInstance();
