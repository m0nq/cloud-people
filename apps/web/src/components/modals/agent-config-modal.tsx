import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { useFormik } from 'formik';
import { FormEvent } from 'react';
import { useState } from 'react';
import Image from 'next/image';

import './agent-config-modal.styles.css';
import { useModalStore } from '@stores/modal-store';
import { useAgentCacheStore } from '@stores/agent-cache-store';
import { MinimizeIcon } from '@components/icons/minimize-icon';
import { CheckMarkIcon } from '@components/icons/check-mark-icon';
import { Button } from '@components/utils/button/button';
import { SaveDocumentIcon } from '@components/icons/save-document-icon';
import { InfoIcon } from '@components/icons/info-icon';
import { createAgent } from '@lib/actions/agent-actions';
import cloudHeadImage from '@public/pink-cloud-head.png';

// Zod schema for agent configuration
const agentConfigSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
    description: z.string().max(500, 'Description must be less than 500 characters').default(''),
    config: z.object({
        speed: z.enum(['instant', 'fast', 'slow']).default('instant'),
        contextWindow: z.string().optional().default(''),
        memoryLimit: z.string().default('8g'),
        budget: z.any().transform(val => {
            if (val === '' || val === null || val === undefined) return 0;
            const num = Number(val);
            return isNaN(num) ? 0 : num;
        })
    })
        .default({
            speed: 'instant',
            contextWindow: '',
            memoryLimit: '8g',
            budget: 0
        }),
    models: z.string().optional().default(''),
    tools: z.string().optional().default('')
});

type AgentConfigFormData = z.infer<typeof agentConfigSchema>;

export const AgentConfigModal = () => {
    const { openModal, parentNodeId, isFromModal, closeModal } = useModalStore();
    const { invalidateCache } = useAgentCacheStore();
    const [error, setError] = useState<string | null>(null);

    const formik = useFormik<AgentConfigFormData>({
        initialValues: {
            name: '',
            description: '',
            config: {
                speed: 'instant',
                contextWindow: '',
                memoryLimit: '8g',
                budget: 0
            },
            models: '',
            tools: ''
        },
        validate: async values => {
            try {
                await agentConfigSchema.parseAsync(values);
                return {}; // Return empty object when validation succeeds
            } catch (error) {
                if (error instanceof z.ZodError) {
                    const errors = error.errors.reduce(
                        (acc, curr) => {
                            const path = curr.path.join('.');
                            acc[path] = curr.message;
                            return acc;
                        },
                        {} as Record<string, string>
                    );
                    return errors;
                }
                return { submit: 'Validation failed' };
            }
        },
        onSubmit: async (values, { setSubmitting }) => {
            try {
                setError(null);

                // Sanitize the input values
                const sanitizedValues = {
                    name: DOMPurify.sanitize(values.name),
                    description: DOMPurify.sanitize(values.description),
                    config: {
                        speed: values.config.speed,
                        contextWindow: values.config.contextWindow ? DOMPurify.sanitize(values.config.contextWindow) : '',
                        memoryLimit: values.config.memoryLimit,
                        budget: Number(DOMPurify.sanitize(values.config.budget.toString())),
                        models: values.models || '',
                        tools: values.tools || ''
                    }
                };

                // Create the agent
                const agentRecord = await createAgent({
                    data: {
                        config: {
                            ...sanitizedValues,
                            config: {
                                ...sanitizedValues.config
                            }
                        }
                    }
                });

                if (!agentRecord?.id) {
                    throw new Error('Failed to create agent record');
                }

                // TODO: will need to update AgentTools table to associate the agent with capabilities from the Tools
                // table

                // Close config modal and reopen selection modal
                closeModal();
                if (isFromModal) {
                    invalidateCache(); // Invalidate the cache when agent is created
                    openModal({
                        type: 'agent-selection',
                        parentNodeId,
                        isFromModal: true
                    });
                }
            } catch (err) {
                console.error('Error creating agent:', err);
                setError(err instanceof Error ? err.message : 'Failed to create agent');
            } finally {
                setSubmitting(false);
            }
        }
    });

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        formik.handleSubmit(e);
    };

    const handleClick = () => {
        if (isFromModal) {
            openModal({ type: 'agent-selection', parentNodeId });
        } else {
            closeModal();
        }
    };

    return (
        <div className="agent-config-panel">
            <form onSubmit={handleSubmit}>
                <div className="agent-config-content">
                    {/* Header Section */}
                    <div className="config-header-section">
                        <div className="config-header-container">
                            <div className="config-header-top">
                                <div className="config-header-avatar">
                                    <Image src={cloudHeadImage} alt="Cloud head avatar" width={48} height={48} />
                                </div>
                                <div className="config-agent-title">
                                    <h2>Configure Agent</h2>
                                </div>
                            </div>
                            <input type="text"
                                placeholder="Give your agent a name..."
                                className="name-input" {...formik.getFieldProps('name')} />
                            {formik.touched.name && formik.errors.name &&
                                <div className="error-message">{formik.errors.name}</div>}
                        </div>
                        <button type="button" className="minimize-button" onClick={handleClick}>
                            <MinimizeIcon color="white" width={24} height={24} />
                        </button>
                    </div>

                    {/* Description Section */}
                    <div className="config-description-section">
                        <div className="agent-description-container">
                            <label className="label-details">
                                What would you like this agent to do?
                                <InfoIcon color="#575D69" width={16} height={16} strokeWidth={2} />
                            </label>
                            <textarea id="description" {...formik.getFieldProps('description')}
                                className={`config-input description-input ${formik.touched.description && formik.errors.description ? 'error' : ''}`}
                                placeholder="Does research on historical data and current trends to identify trends and holes in the market for the company to fill." />
                            {formik.touched.description &&
                                formik.errors.description &&
                                <div className="error-message">{formik.errors.description}</div>}
                        </div>
                    </div>

                    {/* Config adjustments Section */}
                    <div className="config-adjustments-section">
                        {/* Speed Section */}
                        <div className="config-speed-section">
                            <label className="label-details">
                                Speed
                                <InfoIcon color="#575D69" width={16} height={16} strokeWidth={2} />
                            </label>
                            <div className="config-speed-container">
                                <label className="speed-button">
                                    <input type="radio" {...formik.getFieldProps('config.speed')}
                                        value="instant"
                                        checked={formik.values.config.speed === 'instant'} />
                                    Instant
                                </label>
                                <label className="speed-button">
                                    <input type="radio" {...formik.getFieldProps('config.speed')}
                                        value="fast"
                                        checked={formik.values.config.speed === 'fast'} />
                                    Fast
                                </label>
                                <label className="speed-button">
                                    <input type="radio" {...formik.getFieldProps('config.speed')}
                                        value="slow"
                                        checked={formik.values.config.speed === 'slow'} />
                                    Slow
                                </label>
                            </div>
                        </div>

                        {/* Context Window */}
                        <div className="config-context-section">
                            <label className="label-details">
                                Context Window
                                <InfoIcon color="#575D69" width={16} height={16} strokeWidth={2} />
                            </label>
                            <input type="text" {...formik.getFieldProps('config.contextWindow')}
                                className="context-input" />
                        </div>

                        {/* Memory and Budget Section */}
                        <div className="memory-budget-section">
                            <div className="memory-container">
                                <label className="label-details">
                                    Memory limit
                                    <InfoIcon color="#575D69" width={16} height={16} strokeWidth={2} />
                                </label>
                                <select className="config-select" {...formik.getFieldProps('config.memoryLimit')}>
                                    <option value="8g">8g</option>
                                    <option value="16g">16g</option>
                                    <option value="32g">32g</option>
                                </select>
                            </div>
                            <div className="budget-container">
                                <label className="label-details">
                                    Assign a budget
                                    <InfoIcon color="#575D69" width={16} height={16} strokeWidth={2} />
                                </label>
                                <input type="text" {...formik.getFieldProps('config.budget')}
                                    className="config-input" />
                            </div>
                        </div>

                        {/* AI Models and Tools Section */}
                        <div className="models-tools-section">
                            <div className="models-section">
                                <label className="label-details">
                                    AI models
                                    <InfoIcon color="#575D69" width={16} height={16} strokeWidth={2} />
                                </label>
                                <input type="text"
                                    placeholder="Search"
                                    className="config-input" {...formik.getFieldProps('models')} />
                                <div className="models-container">
                                    <div className="model-icon bg-emerald-500"></div>
                                    <div className="model-icon bg-purple-500"></div>
                                </div>
                            </div>
                            <div className="tools-section">
                                <label className="label-details">
                                    Tools
                                    <InfoIcon color="#575D69" width={16} height={16} strokeWidth={2} />
                                </label>
                                <input type="text"
                                    placeholder="Search"
                                    className="config-input" {...formik.getFieldProps('tools')} />
                                <div className="tools-container">
                                    <div className="tool-icon bg-emerald-500"></div>
                                    <div className="tool-icon bg-blue-500"></div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="action-buttons-section">
                            <Button variant="primary"
                                size="md"
                                fullWidth
                                icon={<CheckMarkIcon width={18} height={18} color="white" />}>
                                Check
                            </Button>
                            <Button variant="secondary"
                                size="md"
                                fullWidth
                                type="submit"
                                icon={<SaveDocumentIcon width={18} height={18} />}>
                                Save
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};
