import { chromium } from '@playwright/test';
import { Browser } from '@playwright/test';
import { BrowserContext } from '@playwright/test';
import { useBrowserStore } from '@stores/browser-store';

export const validateUrl = (url: string): URL | null => {
    try {
        const parsedUrl = new URL(url);
        return ['http:', 'https:'].includes(parsedUrl.protocol) ? parsedUrl : null;
    } catch {
        return null;
    }
};

export const createBrowser = async (): Promise<Browser> => {
    const browser = await chromium.launch({
        headless: false
    });
    useBrowserStore.getState().setBrowser(browser);
    return browser;
};

export const createContext = async (
    id: string,
    options = { width: 1280, height: 720 }
): Promise<BrowserContext> => {
    const state = useBrowserStore.getState();
    const browser = state.browser || await createBrowser();
    
    const context = await browser.newContext({
        viewport: options
    });
    
    state.setContext(id, context);
    return context;
};

export const navigate = async (
    url: string,
    contextId: string
): Promise<void> => {
    const validUrl = validateUrl(url);
    if (!validUrl) {
        throw new Error('Invalid URL');
    }

    const state = useBrowserStore.getState();
    const context = state.contexts.get(contextId) || await createContext(contextId);
    const page = await context.newPage();
    
    await page.goto(validUrl.toString(), {
        waitUntil: 'domcontentloaded',
        timeout: 30000
    });
};

export const closeContext = async (id: string): Promise<void> => {
    const state = useBrowserStore.getState();
    const context = state.contexts.get(id);
    
    if (context) {
        await context.close();
        state.removeContext(id);
    }
};

export const cleanup = async (): Promise<void> => {
    const state = useBrowserStore.getState();
    const contexts = Array.from(state.contexts.values());
    
    await Promise.all(contexts.map(context => context.close()));
    
    if (state.browser) {
        await state.browser.close();
    }
    
    state.cleanup();
};
