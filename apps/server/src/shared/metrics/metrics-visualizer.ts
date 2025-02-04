import { ExecutionMetrics } from './metrics-collector';
import { AgentStatus } from '@agents/core/interfaces/agent.interface';

export interface PerformanceMetrics {
    memoryUsageOverTime: {
        timestamp: number;
        heapUsed: number;
        heapTotal: number;
    }[];
    cpuUtilization: {
        user: number[];
        system: number[];
        timestamps: number[];
    };
    executionStats: {
        min: number;
        max: number;
        average: number;
        p95: number;
    };
}

export interface AgentAnalytics {
    successRate: number;
    errorDistribution: Record<string, number>;
    toolUsage: {
        toolName: string;
        usageCount: number;
        averageDuration: number;
    }[];
    stateTransitions: {
        from: AgentStatus;
        to: AgentStatus;
        count: number;
    }[];
}

export class MetricsVisualizer {
    private metricsHistory: ExecutionMetrics[] = [];

    addMetrics(metrics: ExecutionMetrics): void {
        this.metricsHistory.push(metrics);
    }

    getPerformanceMetrics(timeWindow?: number): PerformanceMetrics {
        const relevantMetrics = timeWindow
            ? this.metricsHistory.filter(m => Date.now() - m.startTime < timeWindow)
            : this.metricsHistory;

        return {
            memoryUsageOverTime: this.calculateMemoryTimeline(relevantMetrics),
            cpuUtilization: this.calculateCPUUtilization(relevantMetrics),
            executionStats: this.calculateExecutionStats(relevantMetrics)
        };
    }

    getAgentAnalytics(): AgentAnalytics {
        return {
            successRate: this.calculateSuccessRate(),
            errorDistribution: this.calculateErrorDistribution(),
            toolUsage: this.calculateToolUsage(),
            stateTransitions: this.calculateStateTransitions()
        };
    }

    exportToCSV(): string {
        const headers = [
            'executionId',
            'startTime',
            'duration',
            'heapUsed',
            'heapTotal',
            'cpuUser',
            'cpuSystem',
            'success',
            'error'
        ].join(',');

        const rows = this.metricsHistory.map(m => [
            m.executionId,
            m.startTime,
            m.endTime ? m.endTime - m.startTime : '',
            m.memory?.heapUsed || '',
            m.memory?.heapTotal || '',
            m.cpu?.user || '',
            m.cpu?.system || '',
            !m.error,
            m.error?.message || ''
        ].join(','));

        return [headers, ...rows].join('\n');
    }

    private calculateMemoryTimeline(metrics: ExecutionMetrics[]): PerformanceMetrics['memoryUsageOverTime'] {
        return metrics
            .filter(m => m.memory)
            .map(m => ({
                timestamp: m.startTime,
                heapUsed: m.memory!.heapUsed,
                heapTotal: m.memory!.heapTotal
            }));
    }

    private calculateCPUUtilization(metrics: ExecutionMetrics[]): PerformanceMetrics['cpuUtilization'] {
        const cpuMetrics = metrics.filter(m => m.cpu);
        return {
            user: cpuMetrics.map(m => m.cpu!.user),
            system: cpuMetrics.map(m => m.cpu!.system),
            timestamps: cpuMetrics.map(m => m.startTime)
        };
    }

    private calculateExecutionStats(metrics: ExecutionMetrics[]): PerformanceMetrics['executionStats'] {
        const durations = metrics
            .filter(m => m.endTime)
            .map(m => m.endTime! - m.startTime);

        if (durations.length === 0) {
            return { min: 0, max: 0, average: 0, p95: 0 };
        }

        durations.sort((a, b) => a - b);
        const p95Index = Math.floor(durations.length * 0.95);

        return {
            min: durations[0],
            max: durations[durations.length - 1],
            average: durations.reduce((a, b) => a + b, 0) / durations.length,
            p95: durations[p95Index]
        };
    }

    private calculateSuccessRate(): number {
        if (this.metricsHistory.length === 0) return 0;
        const successful = this.metricsHistory.filter(m => !m.error).length;
        return successful / this.metricsHistory.length;
    }

    private calculateErrorDistribution(): Record<string, number> {
        let errorCount = 0;
        let totalErrorTime = 0;
        const errorTypes = new Map<string, number>();
        this.metricsHistory.forEach(m => {
            if (m.error) {
                const errorMessage = m.error.message || 'Unknown error';
                errorCount++;
                totalErrorTime += m.endTime! - m.startTime;
                errorTypes.set(errorMessage, (errorTypes.get(errorMessage) || 0) + 1);
            }
        });
        return Object.fromEntries(errorTypes);
    }

    private calculateToolUsage(): AgentAnalytics['toolUsage'] {
        // This would require additional instrumentation in the tool execution
        // For now, return an empty array
        return [];
    }

    private calculateStateTransitions(): AgentAnalytics['stateTransitions'] {
        // This would require additional instrumentation in the agent state management
        // For now, return an empty array
        return [];
    }

    clearHistory(): void {
        this.metricsHistory = [];
    }
}
