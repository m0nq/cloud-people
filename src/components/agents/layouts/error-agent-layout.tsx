import { BaseAgentLayoutProps } from './base-agent-layout';
import { BaseAgentLayout } from './base-agent-layout';

export const ErrorAgentLayout = (props: BaseAgentLayoutProps) => {
    const { state, onRestart } = props;

    return (
        <BaseAgentLayout {...props}>
            <div className="mt-4 p-3 bg-red-50 rounded-md">
                <span className="text-sm font-medium text-red-600">Error</span>
                {state?.error && (
                    <div className="mt-2">
                        <p className="text-sm text-red-600">{state.error}</p>
                        {onRestart && (
                            <button
                                onClick={onRestart}
                                className="mt-2 px-3 py-1 text-sm text-red-600 border border-red-600 rounded-md hover:bg-red-100"
                            >
                                Restart
                            </button>
                        )}
                    </div>
                )}
            </div>
        </BaseAgentLayout>
    );
};
