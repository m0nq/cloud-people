import { BaseAgentLayout} from './base-agent-layout';
import { BaseAgentLayoutProps } from './base-agent-layout';

export const CompleteAgentLayout = (props: BaseAgentLayoutProps) => {
    const { state } = props;

    return (
        <div className="agent-card-container complete">
            <BaseAgentLayout {...props} />
            <div className="agent-runner-status">
                <div className="status-content complete">
                    <span className="status-label">Completed</span>
                    {state?.completedAt && (
                        <div className="completion-info">
                            <p>Completed on</p>
                            <p>{state.completedAt}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
