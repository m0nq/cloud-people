import { type WorkflowState } from '../workflow';

export type QueryUpdateConfig = {
    state?: WorkflowState;
    current_step?: string;
    data?: string;
    updated_at?: Date | string;
    workflow_id?: string;
    to_node_id?: string;
    from_node_id?: string;
};

export type QueryFilterConfig = {
    [key: string]: {
        eq: string;
    };
};

export type QueryConfig = {
    name?: string;
    description?: string;
    config?: any;
    nodeId?: string;
    edgeId?: string;
    filter?: QueryFilterConfig;
    workflowId?: string;
    first?: number;
    last?: number;
    offset?: number;
    data?: any;
    userId?: string;
    set?: QueryUpdateConfig;
    atMost?: number;
    currentStep?: string;
    toNodeId?: string;
    fromNodeId?: string;
    nodeType?: string;
    objects?: { [key: string]: any }[];
    createdBy?: string;
    agentId?: string;
};

export type QueryResults = {
    data: {
        collection: {
            records: any[];
        };
    };
    collection: {
        records: any[];
    };
    records: any[];
};
