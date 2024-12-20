import React from 'react';
import './agent-config-panel.styles.css';

interface AgentConfigPanelProps {
    onSave?: () => void;
    onCheck?: () => void;
}

export const AgentConfigPanel: React.FC<AgentConfigPanelProps> = ({ onSave, onCheck }) => {
    return (
        <div className="agent-config-panel">
            <div className="agent-config-content">
                {/* Header Section */}
                <div className="config-header">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-coral-pink"></div>
                        <div>
                            <h2 className="text-white font-medium">Manager</h2>
                            <p className="text-gray-400 text-sm">Mike</p>
                        </div>
                    </div>
                </div>

                {/* Goals Section */}
                <div className="config-section">
                    <label className="config-label flex items-center gap-2">
                        What does this agent do, what are their goals?
                        <span className="text-gray-400 rounded-full border border-gray-400 w-4 h-4 flex items-center justify-center text-xs">?</span>
                    </label>
                    <p className="text-gray-400 text-sm">Does research on historical data and current trends to identify trends and holes in the market for the company to fill.</p>
                </div>

                {/* Speed Section */}
                <div className="config-section">
                    <label className="config-label flex items-center gap-2">
                        Speed
                        <span className="text-gray-400 rounded-full border border-gray-400 w-4 h-4 flex items-center justify-center text-xs">?</span>
                    </label>
                    <div className="flex gap-4">
                        <button className="speed-button active">Instant</button>
                        <button className="speed-button">Fast</button>
                        <button className="speed-button">Slow</button>
                    </div>
                </div>

                {/* Context Window */}
                <div className="config-section">
                    <label className="config-label flex items-center gap-2">
                        Context Window
                        <span className="text-gray-400 rounded-full border border-gray-400 w-4 h-4 flex items-center justify-center text-xs">?</span>
                    </label>
                    <input type="text" placeholder="Text field, prompt, upload file or all of the above" className="context-input" />
                </div>

                {/* Memory and Budget Section */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="config-section">
                        <label className="config-label flex items-center gap-2">
                            Memory limit
                            <span className="text-gray-400 rounded-full border border-gray-400 w-4 h-4 flex items-center justify-center text-xs">?</span>
                        </label>
                        <select className="config-select">
                            <option>8g</option>
                        </select>
                    </div>
                    <div className="config-section">
                        <label className="config-label flex items-center gap-2">
                            Assign a budget
                            <span className="text-gray-400 rounded-full border border-gray-400 w-4 h-4 flex items-center justify-center text-xs">?</span>
                        </label>
                        <input type="text" value="$1000" className="config-input" />
                    </div>
                </div>

                {/* AI Models and Tools Section */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="config-section">
                        <label className="config-label flex items-center gap-2">
                            AI models
                            <span className="text-gray-400 rounded-full border border-gray-400 w-4 h-4 flex items-center justify-center text-xs">?</span>
                        </label>
                        <input type="text" placeholder="Search" className="config-input" />
                        <div className="flex gap-2 mt-2">
                            <div className="model-icon bg-emerald-500"></div>
                            <div className="model-icon bg-purple-500"></div>
                        </div>
                    </div>
                    <div className="config-section">
                        <label className="config-label flex items-center gap-2">
                            Tools
                            <span className="text-gray-400 rounded-full border border-gray-400 w-4 h-4 flex items-center justify-center text-xs">?</span>
                        </label>
                        <input type="text" placeholder="Search" className="config-input" />
                        <div className="flex gap-2 mt-2">
                            <div className="tool-icon bg-emerald-500"></div>
                            <div className="tool-icon bg-blue-500"></div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 mt-6">
                    <button onClick={onCheck} className="action-button check-button">
                        Check
                    </button>
                    <button onClick={onSave} className="action-button save-button">
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};
