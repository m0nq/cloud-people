import { type CSSProperties } from 'react';

import { type AgentData } from '@app-types/agent';
import { type AgentState } from '@app-types/agent';
import { AgentStatus } from '@app-types/agent';
import { IdleAgentLayout } from './layouts';
import { WorkingAgentLayout } from './layouts';
import { AssistanceAgentLayout } from './layouts';
import { CompleteAgentLayout } from './layouts';
import { BaseAgentLayout } from './layouts';
import { ActivatingAgentLayout } from './layouts';

type AgentCardProps = {
    data: AgentData;
    status?: AgentStatus;
    state?: AgentState;
    className?: string;
    style?: CSSProperties;
    onEdit?: () => void;
    onAssistanceRequest?: () => void;
    onRestart?: () => void;
};

const AGENT_LAYOUTS = {
    [AgentStatus.Initial]: BaseAgentLayout,
    [AgentStatus.Idle]: IdleAgentLayout,
    [AgentStatus.Activating]: ActivatingAgentLayout,
    [AgentStatus.Working]: WorkingAgentLayout,
    [AgentStatus.Error]: AssistanceAgentLayout,
    [AgentStatus.Assistance]: AssistanceAgentLayout,
    [AgentStatus.Complete]: CompleteAgentLayout
};

export const AgentCard = (props: AgentCardProps) => {
    const { status } = props;

    const LayoutComponent = status ? AGENT_LAYOUTS[status] : BaseAgentLayout;

    return <LayoutComponent {...props} />;
};
