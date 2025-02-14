import { type CSSProperties } from 'react';

import { type AgentData } from '@app-types/agent';
import { type Agent } from '@app-types/agent';
import { AgentState } from '@app-types/agent';
import { IdleAgentLayout } from './layouts';
import { WorkingAgentLayout } from './layouts';
import { AssistanceAgentLayout } from './layouts';
import { CompleteAgentLayout } from './layouts';
import { BaseAgentLayout } from './layouts';
import { ActivatingAgentLayout } from './layouts';

type AgentCardProps = {
    data: AgentData;
    agent?: Agent;
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

export const AgentCard = (props: AgentCardProps) => {
    const { state } = props;

    const LayoutComponent = state ? AGENT_LAYOUTS[state] : BaseAgentLayout;

    return <LayoutComponent {...props} />;
};
