import type { AgentData } from '@app-types/agent';
import type { AgentCapability } from '@app-types/agent';
import type { AgentConfig } from '@app-types/agent';

export const browserNavigateCapability: AgentCapability = {
    id: 'browser_navigate',
    name: 'Browser Navigation',
    description: 'Navigate to Google search',
    action: 'navigate_to_google',
    parameters: {
        url: 'https://www.google.com'
    }
};

export const browserConfig: AgentConfig = {
    actions: [{
        type: 'browser',
        command: 'navigate',
        url: 'https://www.google.com'
    }],
    aiEnabled: false
};

export const browserNavigationAgent: AgentData = {
    id: 'browser_navigation',
    name: 'Browser Navigation',
    role: 'Navigate to websites',
    config: browserConfig,
    capability: browserNavigateCapability
};
