import './agent-card.styles.css';

import { BaseAgentLayoutProps } from './base-agent-layout';
import { BaseAgentLayout } from './base-agent-layout';

export const WorkingAgentLayout = (props: BaseAgentLayoutProps) => {
    const { state } = props;

    return (
        <BaseAgentLayout {...props}>
            <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-600">In Progress</span>
                    {state?.progress && (
                        <span className="text-sm text-gray-600">{state.progress}%</span>
                    )}
                </div>
                {state?.progress && (
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
                            style={{ width: `${state.progress}%` }}
                        />
                    </div>
                )}
            </div>
        </BaseAgentLayout>
    );
};
