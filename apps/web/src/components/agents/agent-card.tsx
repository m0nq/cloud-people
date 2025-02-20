import { type CSSProperties, type ReactNode } from 'react';

import { AgentData, AgentState } from '@app-types/agent';
import { IdleAgentLayout } from './layouts';
import { WorkingAgentLayout } from './layouts';
import { AssistanceAgentLayout } from './layouts';
import { CompleteAgentLayout } from './layouts';
import { BaseAgentLayout } from './layouts';
import { ActivatingAgentLayout } from './layouts';

type AgentCardProps = {
    agentId: string;
    agentData?: AgentData;
    state?: AgentState;
    className?: string;
    style?: CSSProperties;
    onEdit?: () => void;
    onAssistanceRequest?: () => void;
    onRestart?: () => void;
};

const AGENT_LAYOUTS = {
    [AgentState.Initial]: BaseAgentLayout,
    [AgentState.Idle]: IdleAgentLayout,
    [AgentState.Activating]: ActivatingAgentLayout,
    [AgentState.Working]: WorkingAgentLayout,
    [AgentState.Error]: AssistanceAgentLayout,
    [AgentState.Assistance]: AssistanceAgentLayout,
    [AgentState.Complete]: CompleteAgentLayout
};

export const AgentCard = ({
    agentId,
    agentData,
    state = AgentState.Initial,
    onEdit,
    onAssistanceRequest,
    onRestart,
    className = '',
    style
}: AgentCardProps): ReactNode => {
    const layoutProps = {
        agentId,
        agentData,
        onEdit,
        onAssistanceRequest,
        onRestart,
        className,
        style
    };

    const LayoutComponent = state ? AGENT_LAYOUTS[state] : BaseAgentLayout;

    return <LayoutComponent {...layoutProps} />;
};
