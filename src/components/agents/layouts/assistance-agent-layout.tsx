import { BaseAgentLayout } from './base-agent-layout';
import { BaseAgentLayoutProps } from './base-agent-layout';

export const AssistanceAgentLayout = (props: BaseAgentLayoutProps) => {
    const { state, onAssistanceRequest } = props;

    return (
        <BaseAgentLayout {...props}>
            <div className="mt-4 p-3 bg-yellow-50 rounded-md">
                <span className="text-sm font-medium text-yellow-700">Needs Assistance</span>
                {state?.assistanceMessage && (
                    <div className="mt-2">
                        <p className="text-sm text-yellow-700">{state.assistanceMessage}</p>
                        {onAssistanceRequest && (
                            <button
                                onClick={onAssistanceRequest}
                                className="mt-2 px-3 py-1 text-sm text-yellow-700 border border-yellow-600 rounded-md hover:bg-yellow-100"
                            >
                                Provide Assistance
                            </button>
                        )}
                    </div>
                )}
            </div>
        </BaseAgentLayout>
    );
};
