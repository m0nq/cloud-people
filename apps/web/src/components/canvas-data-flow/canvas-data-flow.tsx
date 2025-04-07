'use client';

import { ReactElement } from 'react';

import { WorkflowDataViewer } from '@components/workflow/workflow-data-viewer';
import { useWorkflowStore } from '@stores/workflow';
import './canvas-data-flow.styles.css';

/**
 * Canvas Data Flow component that displays the workflow data passing visualization
 */
export const CanvasDataFlow = (): ReactElement => {
  const workflowExecution = useWorkflowStore(state => state.workflowExecution);

  return (
    <div className="canvas-data-flow">
      <div className="container">
        <h2 className="title">Workflow Data Flow</h2>

        {!workflowExecution ? (
          <div className="empty-state">
            <p className="message">No active workflow. Start a workflow to see data passing between agents.</p>
          </div>
        ) : (
          <div className="workflow-container">
            <div className="status-card">
              <h3 className="card-title">Workflow Status</h3>
              <div className="status-grid">
                <div className="status-item">
                  <span className="label">Status:</span>
                  <span className="value">{workflowExecution.state}</span>
                </div>
                <div className="status-item">
                  <span className="label">Started:</span>
                  <span>{new Date(workflowExecution.startedAt).toLocaleString()}</span>
                </div>
                {workflowExecution.completedAt && (
                  <div className="status-item">
                    <span className="label">Completed:</span>
                    <span>{new Date(workflowExecution.completedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            <WorkflowDataViewer />
          </div>
        )}
      </div>
    </div>
  );
};
