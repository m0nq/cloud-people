import { z } from 'zod';

import { ITool } from './interfaces/tool.interface';
import { ToolParameterSchema } from './interfaces/tool.interface';
import { ValidationResult } from './interfaces/tool.interface';

export class ToolRegistry {
    private static instance: ToolRegistry;
    private tools: Map<string, ITool> = new Map();
    private categories: Map<string, Set<string>> = new Map();

    private constructor() {
        this.initializeDefaultCategories();
    }

    static getInstance(): ToolRegistry {
        if (!ToolRegistry.instance) {
            ToolRegistry.instance = new ToolRegistry();
        }
        return ToolRegistry.instance;
    }

    private initializeDefaultCategories() {
        this.categories.set('browser', new Set());
        this.categories.set('llm', new Set());
        this.categories.set('data', new Set());
        this.categories.set('utility', new Set());
    }

    registerTool(tool: ITool): void {
        if (this.tools.has(tool.name)) {
            throw new Error(`Tool ${tool.name} already registered`);
        }

        this.tools.set(tool.name, tool);
        const categorySet = this.categories.get(tool.category);
        if (categorySet) {
            categorySet.add(tool.name);
        }
    }

    getTool<T extends ITool>(name: string): T | undefined {
        return this.tools.get(name) as T;
    }

    getToolsByCategory(category: string): ITool[] {
        const toolNames = this.categories.get(category);
        return toolNames ? Array.from(toolNames).map(name => this.tools.get(name)!) : [];
    }

    validateToolParameters(toolName: string, params: unknown): ValidationResult {
        const tool = this.getTool(toolName);
        if (!tool) {
            return {
                valid: false,
                errors: [`Tool ${toolName} not found`]
            };
        }

        // Use custom validation if provided
        if (tool.validate) {
            return tool.validate(params);
        }

        // Convert ToolParameterSchema to Zod schema
        try {
            const schema = this.createZodSchema(tool.parameters);
            const result = schema.safeParse(params);
            
            return {
                valid: result.success,
                errors: !result.success ? result.error.errors.map(err => `${err.path.join('.')} ${err.message}`) : undefined
            };
        } catch (error) {
            return {
                valid: false,
                errors: ['Invalid schema definition']
            };
        }
    }

    private createZodSchema(parameters: ToolParameterSchema): z.ZodObject<any> {
        const shape: Record<string, z.ZodTypeAny> = {};
        
        for (const [key, param] of Object.entries(parameters)) {
            let fieldSchema: z.ZodTypeAny;
            
            switch (param.type) {
                case 'string':
                    fieldSchema = z.string();
                    if (param.enum) {
                        fieldSchema = z.enum(param.enum as [string, ...string[]]);
                    }
                    break;
                case 'number':
                    fieldSchema = z.number();
                    break;
                case 'boolean':
                    fieldSchema = z.boolean();
                    break;
                case 'array':
                    fieldSchema = z.array(z.any());
                    break;
                case 'object':
                    fieldSchema = param.schema ? z.object(this.createZodSchema(param.schema as unknown as ToolParameterSchema).shape) : z.record(z.any());
                    break;
                default:
                    fieldSchema = z.any();
            }
            
            shape[key] = param.required ? fieldSchema : fieldSchema.optional();
        }
        
        return z.object(shape).strict();
    }
}
