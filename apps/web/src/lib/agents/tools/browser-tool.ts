import { Tool } from '../types';
import { chromium, Browser, Page } from 'playwright';

export class BrowserTool implements Tool {
    private browser: Browser | null = null;
    private page: Page | null = null;

    async initialize(): Promise<void> {
        if (!this.browser) {
            this.browser = await chromium.launch({
                headless: false // Make browser visible for demonstration
            });
            this.page = await this.browser.newPage();
        }
    }

    async execute(action: string, params: Record<string, unknown>): Promise<Record<string, unknown>> {
        if (!this.page) {
            throw new Error('Browser not initialized');
        }

        switch (action) {
            case 'navigate':
                const url = params.url as string;
                if (!url) throw new Error('URL is required for navigation');
                await this.page.goto(url);
                return { success: true, currentUrl: this.page.url() };

            case 'click':
                const selector = params.selector as string;
                if (!selector) throw new Error('Selector is required for clicking');
                await this.page.click(selector);
                return { success: true };

            case 'type':
                const text = params.text as string;
                const inputSelector = params.selector as string;
                if (!text || !inputSelector) throw new Error('Text and selector are required for typing');
                await this.page.type(inputSelector, text);
                return { success: true };

            default:
                throw new Error(`Unknown browser action: ${action}`);
        }
    }

    async cleanup(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
        }
    }
}
