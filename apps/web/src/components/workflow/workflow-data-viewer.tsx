'use client';

import { ReactElement } from 'react';
import { useCallback } from 'react';
import { useState } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { AgentResult } from '@app-types/agent';
import { isWorkflowNode } from '@stores/workflow';
import { useWorkflowStore } from '@stores/workflow';

/**
 * Component to visualize data flow between agents in a workflow
 */
export const WorkflowDataViewer = (): ReactElement => {
  const workflowContext = useWorkflowStore(useShallow(state => state.workflowContext));
  const nodes = useWorkflowStore(state => state.nodes);
  const [expandedAgents, setExpandedAgents] = useState<Record<string, boolean>>({});
  
  // Get agent names for display
  const getAgentName = useCallback((agentId: string): string => {
    const node = nodes.find(n => 
      isWorkflowNode(n) && n.data.agentRef?.agentId === agentId
    );
    
    if (!node) return agentId;
    
    // Check if the node has a label property (for InitialStateNodeData)
    if ('label' in node.data) {
      // Explicitly cast node.data.label and the fallback to string
      return String(node.data.label || `Agent ${agentId.substring(0, 8)}`);
    }
    
    // For regular NodeData, use the agent ID
    return `Agent ${agentId.substring(0, 8)}`;
  }, [nodes]);
  
  // Toggle expanded state for an agent
  const toggleExpand = useCallback((agentId: string) => {
    setExpandedAgents(prev => ({
      ...prev,
      [agentId]: !prev[agentId]
    }));
  }, []);
  
  // Format data for display
  const formatData = useCallback((data: unknown): string => {
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return String(data);
    }
  }, []);
  
  return (
    <div className="workflow-data-viewer bg-white rounded-md shadow-md p-4 mb-4">
      <h3 className="text-lg font-semibold mb-4">Workflow Data Flow</h3>
      {Object.entries(workflowContext.data).length === 0 ? (
        <p className="text-gray-500 italic">No data has been passed between agents yet.</p>
      ) : (
        <div className="data-flow-container flex flex-col space-y-4">
          {Object.entries(workflowContext.data).map(([agentId, result]) => {
            const agentDisplayName = getAgentName(agentId);
            
            return (
              <div key={agentId} className="agent-data-card border border-gray-200 rounded-md overflow-hidden">
                <div 
                  className="agent-header bg-gray-50 p-3 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleExpand(agentId)}
                >
                  <div>
                    <h4 className="font-medium">{agentDisplayName}</h4>
                    <span className="agent-id text-xs text-gray-500">{agentId.substring(0, 8)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      v{result.version}
                    </span>
                    <span className="text-xs">
                      {new Date(result.timestamp).toLocaleString()}
                    </span>
                    <svg 
                      className={`w-5 h-5 transition-transform ${expandedAgents[agentId] ? 'transform rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {expandedAgents[agentId] && (
                  <div className="data-preview p-3">
                    <div className="bg-gray-50 p-3 rounded overflow-auto max-h-96">
                      <pre className="text-xs">{formatData(result.data)}</pre>
                    </div>
                    {result.metadata && (
                      <div className="mt-2">
                        <h5 className="text-sm font-medium mb-1">Metadata</h5>
                        <div className="bg-gray-50 p-3 rounded overflow-auto max-h-40">
                          <pre className="text-xs">{formatData(result.metadata)}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
