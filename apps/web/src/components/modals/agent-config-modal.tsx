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
import { AgentSpeed } from '@app-types/agent';
import { MemoryLimit } from '@app-types/agent';
import cloudHeadImage from '@public/pink-cloud-head.png';

// Zod schema for agent configuration
const agentConfigSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
    description: z.string().max(500, 'Description must be less than 500 characters').default(''),
    speed: z.nativeEnum(AgentSpeed).default(AgentSpeed.Instant),
    contextWindow: z.string().optional().default(''),
    memoryLimit: z.nativeEnum(MemoryLimit).default(MemoryLimit.Small),
    budget: z
        .string()
        .transform(val => {
            // Remove any non-numeric characters
            const cleanVal = val.replace(/[^0-9.]/g, '');

            // Handle multiple decimal points by keeping only the first one
            const parts = cleanVal.split('.');
            const whole = parts[0] || '0';
            const decimal = parts[1] || '00';

            // Combine and parse as float, limiting to 2 decimal places
            const num = parseFloat(whole + '.' + decimal.slice(0, 2));
            return isNaN(num) ? 0 : num;
        })
        .refine(val => val >= 0, 'Amount must be positive'),
    models: z.string().optional().default(''),
    tools: z.string().optional().default('')
});

type AgentConfigFormData = Omit<z.infer<typeof agentConfigSchema>, 'budget'> & {
    budget: string;
};

export const AgentConfigModal = () => {
    const { openModal, parentNodeId, isFromModal, closeModal } = useModalStore();
    const { invalidateCache } = useAgentCacheStore();
    const [error, setError] = useState<string | null>(null);

    const formatBudgetDisplay = (value: string): string => {
        // Remove any non-numeric characters except decimal
        const cleanVal = value.replace(/[^0-9.]/g, '');

        // Handle decimal places and multiple decimal points
        const parts = cleanVal.split('.');
        const whole = parts[0] || '0';
        const decimal = parts[1]?.slice(0, 2) || '00';

        // Add commas for thousands
        const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        return withCommas + '.' + decimal;
    };

    const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only allow numbers and a single decimal point
        let value = e.target.value.replace(/[^0-9.]/g, '');

        // Handle multiple decimal points by keeping only the first one
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts[1];
        }

        formik.setFieldValue('budget', value);
    };

    const formik = useFormik<AgentConfigFormData>({
        initialValues: {
            name: '',
            description: '',
            speed: AgentSpeed.Instant,
            contextWindow: '',
            memoryLimit: MemoryLimit.Small,
            budget: '0.00',
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
                    speed: values.speed,
                    contextWindow: values.contextWindow ? DOMPurify.sanitize(values.contextWindow) : '',
                    memoryLimit: values.memoryLimit,
                    budget: values.budget.replace(/[^0-9.]/g, ''), // Remove currency formatting
                    models: values.models || '',
                    tools: values.tools || ''
                };

                // Create the agent
                const agentRecord = await createAgent({
                    data: {
                        ...sanitizedValues
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
                            <input type="text" placeholder="Give your agent a name..." className="name-input" {...formik.getFieldProps('name')} />
                            {formik.touched.name && formik.errors.name && <div className="w-full h-fit text-white">{formik.errors.name}</div>}
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
                            <textarea
                                id="description"
                                {...formik.getFieldProps('description')}
                                className={`config-input description-input ${formik.touched.description && formik.errors.description ? 'error' : ''}`}
                                placeholder="Does research on historical data and current trends to identify trends and holes in the market for the company to fill."
                            />
                            {formik.touched.description && formik.errors.description && <div className="w-full h-fit text-white">{formik.errors.description}</div>}
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
                                    <input type="radio" {...formik.getFieldProps('speed')} value={AgentSpeed.Instant} checked={formik.values.speed === AgentSpeed.Instant} />
                                    Instant
                                </label>
                                <label className="speed-button">
                                    <input type="radio" {...formik.getFieldProps('speed')} value={AgentSpeed.Fast} checked={formik.values.speed === AgentSpeed.Fast} />
                                    Fast
                                </label>
                                <label className="speed-button">
                                    <input type="radio" {...formik.getFieldProps('speed')} value={AgentSpeed.Slow} checked={formik.values.speed === AgentSpeed.Slow} />
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
                            <input type="text" {...formik.getFieldProps('contextWindow')} className="context-input" />
                        </div>

                        {/* Memory and Budget Section */}
                        <div className="memory-budget-section">
                            <div className="memory-container">
                                <label className="label-details">
                                    Memory limit
                                    <InfoIcon color="#575D69" width={16} height={16} strokeWidth={2} />
                                </label>
                                <select className="config-select" {...formik.getFieldProps('memoryLimit')}>
                                    <option value={MemoryLimit.Small}>{MemoryLimit.Small}</option>
                                    <option value={MemoryLimit.Medium}>{MemoryLimit.Medium}</option>
                                    <option value={MemoryLimit.Large}>{MemoryLimit.Large}</option>
                                </select>
                            </div>
                            <div className="budget-container">
                                <label className="label-details">
                                    Assign a budget
                                    <InfoIcon color="#575D69" width={16} height={16} strokeWidth={2} />
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300">$</span>
                                    <input
                                        type="text"
                                        {...formik.getFieldProps('budget')}
                                        onChange={handleBudgetChange}
                                        onBlur={e => {
                                            const formatted = formatBudgetDisplay(e.target.value);
                                            formik.setFieldValue('budget', formatted);
                                            formik.handleBlur(e);
                                        }}
                                        className="config-input currency-input"
                                    />
                                </div>
                                {formik.touched.budget && formik.errors.budget && <div className="text-white w-full h-fit">{formik.errors.budget}</div>}
                            </div>
                        </div>

                        {/* AI Models and Tools Section */}
                        <div className="models-tools-section">
                            <div className="models-section">
                                <label className="label-details">
                                    AI models
                                    <InfoIcon color="#575D69" width={16} height={16} strokeWidth={2} />
                                </label>
                                <input type="text" placeholder="Search" className="config-input" {...formik.getFieldProps('models')} />
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
                                <input type="text" placeholder="Search" className="config-input" {...formik.getFieldProps('tools')} />
                                <div className="tools-container">
                                    <div className="tool-icon bg-emerald-500"></div>
                                    <div className="tool-icon bg-blue-500"></div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="action-buttons-section">
                            <Button variant="primary" size="md" fullWidth icon={<CheckMarkIcon width={18} height={18} color="white" />}>
                                Check
                            </Button>
                            <Button variant="secondary" size="md" fullWidth type="submit" icon={<SaveDocumentIcon width={18} height={18} />}>
                                Save
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};
