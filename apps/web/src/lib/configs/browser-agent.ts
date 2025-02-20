import type { AgentConfig } from '@app-types/agent';
import { AgentSpeed } from '@app-types/agent';

export const defaultBrowserCapability = {
    id: 'browser_navigation',
    name: 'Browser Navigation',
    description: 'Navigate to specified URLs in a controlled browser environment',
    action: 'navigate',
    parameters: {
        url: 'https://www.google.com' // Default URL
    }
};

export const defaultBrowserConfig: AgentConfig = {
    actions: [{
        type: 'browser',
        command: 'navigate',
        url: 'https://www.google.com'
    }],
    aiEnabled: false,
    agentSpeed: AgentSpeed.Instant,
    metadata: {
        browserType: 'chromium',
        headless: false,
        viewport: {
            width: 1280,
            height: 720
        }
    }
};
