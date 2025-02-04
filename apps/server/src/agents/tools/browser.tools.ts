import { z } from 'zod';

import { ITool } from '@agents/core/interfaces/tool.interface';
import { ToolResult } from '@agents/core/interfaces/tool.interface';
import { BrowserChain } from '@agents/browser/browser.chain';

export class BrowserTools {
    constructor(private chain: BrowserChain) {}

    getTools(): Record<string, ITool> {
        return {
            navigate: {
                name: 'navigate',
                description: 'Navigate to a URL',
                version: '1.0.0',
                category: 'browser',
                parameters: {
                    url: {
                        type: 'string',
                        required: true,
                        description: 'URL to navigate to'
                    }
                },
                validate: (params: unknown) => {
                    const schema = z.object({
                        url: z.string().url()
                    });
                    const result = schema.safeParse(params);
                    
                    if (!result.success) {
                        return {
                            valid: false,
                            errors: result.error.errors.map(err => err.message)
                        };
                    }
                    
                    return {
                        valid: true
                    };
                },
                execute: async (params: { url: string }): Promise<ToolResult<string>> => {
                    try {
                        await this.chain.goto(params.url);
                        return {
                            success: true,
                            data: `Navigated to ${params.url}`
                        };
                    } catch (error) {
                        return {
                            success: false,
                            data: '',
                            error: `Failed to navigate: ${error instanceof Error ? error.message : String(error)}`
                        };
                    }
                }
            },

            click: {
                name: 'click',
                description: 'Click an element on the page',
                version: '1.0.0',
                category: 'browser',
                parameters: {
                    selector: {
                        type: 'string',
                        required: true,
                        description: 'CSS selector for the element to click'
                    }
                },
                validate: (params: unknown) => {
                    const schema = z.object({
                        selector: z.string()
                    });
                    const result = schema.safeParse(params);
                    
                    if (!result.success) {
                        return {
                            valid: false,
                            errors: result.error.errors.map(err => err.message)
                        };
                    }
                    
                    return {
                        valid: true
                    };
                },
                execute: async (params: { selector: string }): Promise<ToolResult<string>> => {
                    try {
                        await this.chain.click(params.selector);
                        return {
                            success: true,
                            data: `Clicked element at selector: ${params.selector}`
                        };
                    } catch (error) {
                        return {
                            success: false,
                            data: '',
                            error: `Failed to click element: ${error instanceof Error ? error.message : String(error)}`
                        };
                    }
                }
            },

            type: {
                name: 'type',
                description: 'Type text into an input field',
                version: '1.0.0',
                category: 'browser',
                parameters: {
                    selector: {
                        type: 'string',
                        required: true,
                        description: 'CSS selector for the input field'
                    },
                    text: {
                        type: 'string',
                        required: true,
                        description: 'Text to type into the input field'
                    }
                },
                validate: (params: unknown) => {
                    const schema = z.object({
                        selector: z.string(),
                        text: z.string()
                    });
                    const result = schema.safeParse(params);
                    
                    if (!result.success) {
                        return {
                            valid: false,
                            errors: result.error.errors.map(err => err.message)
                        };
                    }
                    
                    return {
                        valid: true
                    };
                },
                execute: async (params: { selector: string; text: string }): Promise<ToolResult<string>> => {
                    try {
                        await this.chain.type(params.selector, params.text);
                        return {
                            success: true,
                            data: `Typed "${params.text}" into ${params.selector}`
                        };
                    } catch (error) {
                        return {
                            success: false,
                            data: '',
                            error: `Failed to type text: ${error instanceof Error ? error.message : String(error)}`
                        };
                    }
                }
            },

            waitForElement: {
                name: 'waitForElement',
                description: 'Wait for an element to appear on the page',
                version: '1.0.0',
                category: 'browser',
                parameters: {
                    selector: {
                        type: 'string',
                        required: true,
                        description: 'CSS selector for the element to wait for'
                    }
                },
                validate: (params: unknown) => {
                    const schema = z.object({
                        selector: z.string()
                    });
                    const result = schema.safeParse(params);
                    
                    if (!result.success) {
                        return {
                            valid: false,
                            errors: result.error.errors.map(err => err.message)
                        };
                    }
                    
                    return {
                        valid: true
                    };
                },
                execute: async (params: { selector: string }): Promise<ToolResult<string>> => {
                    try {
                        await this.chain.waitForSelector(params.selector);
                        return {
                            success: true,
                            data: `Element ${params.selector} is now visible`
                        };
                    } catch (error) {
                        return {
                            success: false,
                            data: '',
                            error: `Failed to find element: ${error instanceof Error ? error.message : String(error)}`
                        };
                    }
                }
            },

            getCurrentUrl: {
                name: 'getCurrentUrl',
                description: 'Get the current page URL',
                version: '1.0.0',
                category: 'browser',
                parameters: {},
                validate: () => ({
                    valid: true
                }),
                execute: async (): Promise<ToolResult<string>> => {
                    try {
                        const url = await this.chain.getCurrentUrl();
                        return {
                            success: true,
                            data: `Current URL: ${url}`
                        };
                    } catch (error) {
                        return {
                            success: false,
                            data: '',
                            error: `Failed to get URL: ${error instanceof Error ? error.message : String(error)}`
                        };
                    }
                }
            },

            getPageTitle: {
                name: 'getPageTitle',
                description: 'Get the current page title',
                version: '1.0.0',
                category: 'browser',
                parameters: {},
                validate: () => ({
                    valid: true
                }),
                execute: async (): Promise<ToolResult<string>> => {
                    try {
                        const title = await this.chain.getPageTitle();
                        return {
                            success: true,
                            data: `Page title: ${title}`
                        };
                    } catch (error) {
                        return {
                            success: false,
                            data: '',
                            error: `Failed to get page title: ${error instanceof Error ? error.message : String(error)}`
                        };
                    }
                }
            },

            evaluateScript: {
                name: 'evaluateScript',
                description: 'Execute JavaScript in the page context',
                version: '1.0.0',
                category: 'browser',
                parameters: {
                    script: {
                        type: 'string',
                        required: true,
                        description: 'JavaScript code to execute'
                    }
                },
                validate: (params: unknown) => {
                    const schema = z.object({
                        script: z.string()
                    });
                    const result = schema.safeParse(params);
                    
                    if (!result.success) {
                        return {
                            valid: false,
                            errors: result.error.errors.map(err => err.message)
                        };
                    }
                    
                    return {
                        valid: true
                    };
                },
                execute: async (params: { script: string }): Promise<ToolResult<string>> => {
                    try {
                        const result = await this.chain.evaluate(params.script);
                        return {
                            success: true,
                            data: `Script executed. Result: ${JSON.stringify(result)}`
                        };
                    } catch (error) {
                        return {
                            success: false,
                            data: '',
                            error: `Failed to execute script: ${error instanceof Error ? error.message : String(error)}`
                        };
                    }
                }
            }
        };
    }
}
