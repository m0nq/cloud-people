import { BaseAgentLayout } from './base-agent-layout';
import { BaseAgentLayoutProps } from './base-agent-layout';

export const AssistanceAgentLayout = (props: BaseAgentLayoutProps) => {
    const { state, onAssistanceRequest } = props;

    return (
        <div className="agent-card-container assistance">
            <BaseAgentLayout {...props} />
            <div className="agent-runner-status">
                <div className="status-content assistance">
                    <span className="status-label">Needs Assistance</span>
                    {state?.assistanceMessage && (
                        <div className="assistance-message">
                            <p>{state.assistanceMessage}</p>
                            {onAssistanceRequest && (
                                <button onClick={onAssistanceRequest} className="assist-button">
                                    Provide Assistance
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
