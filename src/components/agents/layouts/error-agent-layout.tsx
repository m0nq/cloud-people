import { BaseAgentLayoutProps } from './base-agent-layout';
import { BaseAgentLayout } from './base-agent-layout';

export const ErrorAgentLayout = (props: BaseAgentLayoutProps) => {
    const { state, onRestart } = props;

    return (
        <div className="agent-card-container error">
            <BaseAgentLayout {...props} />
            <div className="agent-runner-status">
                <div className="status-content error">
                    <span className="status-label">Error</span>
                    {state?.error && (
                        <div className="error-message">
                            <p>{state.error}</p>
                            {onRestart && (
                                <button onClick={onRestart} className="restart-button">
                                    Restart
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
