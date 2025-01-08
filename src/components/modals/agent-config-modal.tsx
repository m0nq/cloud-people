import './agent-config-modal.styles.css';
import { useModalStore } from '@stores/modal-store';
import { MinimizeIcon } from '@components/icons/minimize-icon';
import { CheckMarkIcon } from '@components/icons/check-mark-icon';
import { Button } from '@components/utils/button/button';
import { SaveDocumentIcon } from '@components/icons/save-document-icon';
import { InfoIcon } from '@components/icons/info-icon';

interface AgentConfigModalProps {
    onSave?: () => void;
    onCheck?: () => void;
}

// Will probably use save from workflow store for upserting agents
export const AgentConfigModal = ({ onSave, onCheck }: AgentConfigModalProps) => {
    const { openModal, parentNodeId, isFromModal, closeModal } = useModalStore();
    /* The flow is:
     *   modal opens, user configures the new agent.
     *   user clicks save, and it updates the db accordingly
     *       user is notified of success or failure
     *   user clicks close button, and it reopens the agent selection modal
     *      which should be updated with the newly created agent*/
    const handleClick = () => {
        if (isFromModal) {
            openModal({ type: 'agent-selection', parentNodeId });
        } else {
            closeModal();
        }
    };

    return (
        <div className="agent-config-panel">
            <div className="agent-config-content">
                {/* Header Section */}
                <div className="config-header-section">
                    <div className="config-header-container">
                        <div className="config-header-avatar"></div>
                        <div>
                            <h2>Manager</h2>
                            <h2>Mike</h2>
                        </div>
                    </div>
                    <button className="minimize-button" onClick={handleClick}>
                        <MinimizeIcon color="white" width={24} height={24} />
                    </button>
                </div>

                {/* Goals Section */}
                <div className="config-description-section">
                    <div className="agent-description-container">
                        <label className="label-details">
                            What does this agent do, what are their goals?
                            <InfoIcon color="#575D69" strokeWidth={2} />
                        </label>
                        <p className="agent-description">
                            Does research on historical data and current trends to identify trends and holes in the
                            market for the company to fill.
                        </p>
                    </div>
                </div>
                <div className="config-adjustments-section">
                    {/* Speed Section */}
                    <div className="config-speed-section">
                        <label className="label-details">Speed<InfoIcon color="#575D69" strokeWidth={2} /></label>
                        <div className="config-speed-container">
                            <label className="speed-button">
                                <input type="radio" name="speed" defaultValue="instant" defaultChecked />
                                Instant
                            </label>
                            <label className="speed-button">
                                <input type="radio" name="speed" defaultValue="fast" />
                                Fast
                            </label>
                            <label className="speed-button">
                                <input type="radio" name="speed" defaultValue="slow" />
                                Slow
                            </label>
                        </div>
                    </div>

                    {/* Context Window */}
                    <div className="config-context-section">
                        <label className="label-details">
                            Context Window
                            <InfoIcon color="#575D69" strokeWidth={2} />
                        </label>
                        <input placeholder="Text field, prompt, upload file or all of the above"
                            type="text"
                            className="context-input" />
                    </div>

                    {/* Memory and Budget Section */}
                    <div className="memory-budget-section">
                        <div className="memory-container">
                            <label className="label-details">
                                Memory limit
                                <InfoIcon color="#575D69" strokeWidth={2} />
                            </label>
                            <select className="config-select">
                                <option>8g</option>
                            </select>
                        </div>
                        <div className="budget-container">
                            <label className="label-details">
                                Assign a budget
                                <InfoIcon color="#575D69" strokeWidth={2} />
                            </label>
                            <input type="text" value="$1000" className="config-input" />
                        </div>
                    </div>

                    {/* AI Models and Tools Section */}
                    <div className="models-tools-section">
                        <div className="models-section">
                            <label className="label-details">
                                AI models
                                <InfoIcon color="#575D69" strokeWidth={2} />
                            </label>
                            <input type="text" placeholder="Search" className="config-input" />
                            <div className="models-container">
                                <div className="model-icon bg-emerald-500"></div>
                                <div className="model-icon bg-purple-500"></div>
                            </div>
                        </div>
                        <div className="tools-section">
                            <label className="label-details">Tools<InfoIcon color="#575D69" strokeWidth={2} /></label>
                            <input type="text" placeholder="Search" className="config-input" />
                            <div className="tools-container">
                                <div className="tool-icon bg-emerald-500"></div>
                                <div className="tool-icon bg-blue-500"></div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="action-buttons-section">
                        <Button variant="primary" size="md" fullWidth
                            icon={<CheckMarkIcon width={18} height={18} color="white" />}>
                            Check
                        </Button>
                        <Button variant="secondary" size="md" fullWidth
                            icon={<SaveDocumentIcon width={18} height={18} />}>
                            Save
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
