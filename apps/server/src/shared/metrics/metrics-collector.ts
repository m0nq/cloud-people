import { randomUUID } from 'crypto';
import { MetricsVisualizer } from './metrics-visualizer';

export interface MetricsConfig {
    collectMemory?: boolean;
    collectCPU?: boolean;
    collectTiming?: boolean;
    sampleInterval?: number;
}

export interface ExecutionMetrics {
    executionId: string;
    startTime: number;
    endTime?: number;
    instruction: string;
    duration?: number;
    memory?: {
        heapUsed: number;
        heapTotal: number;
        external: number;
        arrayBuffers: number;
    };
    cpu?: {
        user: number;
        system: number;
    };
    error?: Error;
}

export class MetricsCollector {
    private config: Required<MetricsConfig> = {
        collectMemory: true,
        collectCPU: true,
        collectTiming: true,
        sampleInterval: 1000, // ms
    };

    private executions = new Map<string, ExecutionMetrics>();
    private intervalHandles = new Map<string, NodeJS.Timeout>();
    private visualizer = new MetricsVisualizer();

    configure(config: Partial<MetricsConfig>): void {
        this.config = { ...this.config, ...config };
    }

    startExecution(): string {
        const executionId = randomUUID();
        const metrics: ExecutionMetrics = {
            executionId,
            startTime: Date.now(),
            instruction: '',
        };

        this.executions.set(executionId, metrics);

        if (this.config.collectMemory || this.config.collectCPU) {
            this.startMetricsCollection(executionId);
        }

        return executionId;
    }

    recordSuccess(executionId: string, data: {
        instruction: string;
        duration: number;
        memory?: number;
        cpu?: number;
    }): void {
        const metrics = this.executions.get(executionId);
        if (!metrics) return;

        metrics.instruction = data.instruction;
        metrics.duration = data.duration;
        
        if (this.config.collectMemory && data.memory) {
            const memoryUsage = process.memoryUsage();
            metrics.memory = {
                heapUsed: memoryUsage.heapUsed,
                heapTotal: memoryUsage.heapTotal,
                external: memoryUsage.external,
                arrayBuffers: memoryUsage.arrayBuffers
            };
        }

        if (this.config.collectCPU && data.cpu) {
            const cpuUsage = process.cpuUsage();
            metrics.cpu = {
                user: cpuUsage.user,
                system: cpuUsage.system
            };
        }

        this.visualizer.addMetrics(metrics);
    }

    recordError(executionId: string, data: {
        instruction: string;
        error: Error;
    }): void {
        const metrics = this.executions.get(executionId);
        if (!metrics) return;

        metrics.instruction = data.instruction;
        metrics.error = data.error;
        metrics.endTime = Date.now();
        metrics.duration = metrics.endTime - metrics.startTime;
    }

    endExecution(executionId: string): void {
        const metrics = this.executions.get(executionId);
        if (!metrics) return;

        metrics.endTime = Date.now();
        if (!metrics.duration) {
            metrics.duration = metrics.endTime - metrics.startTime;
        }

        this.stopMetricsCollection(executionId);
    }

    getMetrics(executionId: string): ExecutionMetrics | undefined {
        return this.executions.get(executionId);
    }

    getVisualization(timeWindow?: number): {
        performance: import('./metrics-visualizer').PerformanceMetrics;
        analytics: import('./metrics-visualizer').AgentAnalytics;
    } {
        return {
            performance: this.visualizer.getPerformanceMetrics(timeWindow),
            analytics: this.visualizer.getAgentAnalytics()
        };
    }

    exportMetricsToCSV(): string {
        return this.visualizer.exportToCSV();
    }

    private startMetricsCollection(executionId: string): void {
        if (!this.config.sampleInterval) return;

        const handle = setInterval(() => {
            const metrics = this.executions.get(executionId);
            if (!metrics) {
                this.stopMetricsCollection(executionId);
                return;
            }

            if (this.config.collectMemory) {
                const memoryUsage = process.memoryUsage();
                metrics.memory = {
                    heapUsed: memoryUsage.heapUsed,
                    heapTotal: memoryUsage.heapTotal,
                    external: memoryUsage.external,
                    arrayBuffers: memoryUsage.arrayBuffers
                };
            }

            if (this.config.collectCPU) {
                const cpuUsage = process.cpuUsage();
                metrics.cpu = {
                    user: cpuUsage.user,
                    system: cpuUsage.system
                };
            }
        }, this.config.sampleInterval);

        this.intervalHandles.set(executionId, handle);
    }

    private stopMetricsCollection(executionId: string): void {
        const handle = this.intervalHandles.get(executionId);
        if (handle) {
            clearInterval(handle as NodeJS.Timeout);
            this.intervalHandles.delete(executionId);
        }
    }
}
