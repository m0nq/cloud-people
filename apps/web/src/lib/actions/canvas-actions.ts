'use server';
import { type Node } from '@xyflow/react';
import { type Edge } from '@xyflow/react';

import type { NodeData } from '@app-types/workflow';
import type { EdgeData } from '@app-types/workflow';
import type { QueryConfig } from '@app-types/api';
import { canvasService } from '@lib/service-providers/canvas-service';

// These will use the service provider pattern
export async function fetchWorkflowNodes(config: QueryConfig = {}): Promise<Node<NodeData>[]> {
    return canvasService.fetchWorkflowNodes(config);
}

export async function fetchWorkflowEdges(config: QueryConfig = {}): Promise<Edge<EdgeData>[]> {
    return canvasService.fetchWorkflowEdges(config);
}
