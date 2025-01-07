import { BaseAgentLayout } from './base-agent-layout';
import { BaseAgentLayoutProps } from './base-agent-layout';

export const IdleAgentLayout = (props: BaseAgentLayoutProps) => {
    return (
        <BaseAgentLayout {...props}>
            <div className="mt-4">
                <span className="text-sm font-medium text-gray-600">Standing By</span>
            </div>
        </BaseAgentLayout>
    );
};
