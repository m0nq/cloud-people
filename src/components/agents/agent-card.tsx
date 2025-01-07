import { CSSProperties } from 'react';

import { AgentData } from '@lib/definitions';
import { AgentState } from '@lib/definitions';
import { AgentStatus } from '@lib/definitions';
import { IdleAgentLayout } from './layouts';
import { WorkingAgentLayout } from './layouts';
import { ErrorAgentLayout } from './layouts';
import { AssistanceAgentLayout } from './layouts';
import { CompleteAgentLayout } from './layouts';
import { BaseAgentLayout } from './layouts';

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
    [AgentStatus.Activating]: WorkingAgentLayout,
    [AgentStatus.Working]: WorkingAgentLayout,
    [AgentStatus.Error]: ErrorAgentLayout,
    [AgentStatus.Assistance]: AssistanceAgentLayout,
    [AgentStatus.Complete]: CompleteAgentLayout
};

export const AgentCard = (props: AgentCardProps) => {
    const { status } = props;
    const LayoutComponent = status ? AGENT_LAYOUTS[status] : BaseAgentLayout;

    return <LayoutComponent {...props} />;
};
