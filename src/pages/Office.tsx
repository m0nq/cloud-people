import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
    addEdge,
    applyEdgeChanges,
    applyNodeChanges,
    Background,
    Connection,
    ConnectionLineType,
    Controls,
    Edge,
    EdgeChange,
    EdgeTypes,
    MarkerType,
    MiniMap,
    Node,
    NodeChange,
    NodeTypes,
    Panel,
    ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Calendar,
    Copy,
    Database,
    ExternalLink,
    FileCode,
    Filter,
    Image,
    MessageSquare,
    Search,
    Server,
    Star,
    Users,
    Zap
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useThemeStore } from '../store/theme';
import { nanoid } from 'nanoid';
import { Input } from '../components/ui/Input';

// Custom Node Components
const TextNode = ({ data, selected }: any) => {
    const { isDarkMode } = useThemeStore();

    return (
        <div className={`px-4 py-3 shadow-md rounded-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-2 ${
            selected
                ? 'border-blue-500'
                : isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
            <div className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{data.label}</div>
            <div
                className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>{data.description || 'Text node'}</div>
        </div>
    );
};

const ImageNode = ({ data, selected }: any) => {
    const { isDarkMode } = useThemeStore();

    return (
        <div className={`shadow-md rounded-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-2 overflow-hidden ${
            selected
                ? 'border-blue-500'
                : isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
            <div className="h-32 bg-gray-100 flex items-center justify-center">
                {data.imageUrl ? (
                    <img src={data.imageUrl} alt={data.label} className="w-full h-full object-cover"/>
                ) : (
                    <Image size={32} className="text-gray-400"/>
                )}
            </div>
            <div className="p-3">
                <div className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{data.label}</div>
            </div>
        </div>
    );
};

const DatabaseNode = ({ data, selected }: any) => {
    const { isDarkMode } = useThemeStore();

    return (
        <div className={`px-4 py-3 shadow-md rounded-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-2 ${
            selected
                ? 'border-blue-500'
                : isDarkMode ? 'border-green-700' : 'border-green-500'
        }`}>
            <div className="flex items-center">
                <Database size={18} className="text-green-500 mr-2"/>
                <div className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{data.label}</div>
            </div>
            <div
                className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>{data.description || 'Database node'}</div>
        </div>
    );
};

const APINode = ({ data, selected }: any) => {
    const { isDarkMode } = useThemeStore();

    return (
        <div className={`px-4 py-3 shadow-md rounded-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-2 ${
            selected
                ? 'border-blue-500'
                : isDarkMode ? 'border-purple-700' : 'border-purple-500'
        }`}>
            <div className="flex items-center">
                <Server size={18} className="text-purple-500 mr-2"/>
                <div className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{data.label}</div>
            </div>
            <div
                className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>{data.description || 'API endpoint'}</div>
        </div>
    );
};

const FunctionNode = ({ data, selected }: any) => {
    const { isDarkMode } = useThemeStore();

    return (
        <div className={`px-4 py-3 shadow-md rounded-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-2 ${
            selected
                ? 'border-blue-500'
                : isDarkMode ? 'border-yellow-700' : 'border-yellow-500'
        }`}>
            <div className="flex items-center">
                <Zap size={18} className="text-yellow-500 mr-2"/>
                <div className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{data.label}</div>
            </div>
            <div
                className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>{data.description || 'Function node'}</div>
            {data.code && (
                <div
                    className={`mt-2 p-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded text-xs font-mono overflow-x-auto ${
                        isDarkMode ? 'text-gray-300' : ''
                    }`}>
                    {data.code}
                </div>
            )}
        </div>
    );
};

// Schedule Node Component
const ScheduleNode = ({ data, selected }: any) => {
    const { isDarkMode } = useThemeStore();
    const [date, setDate] = useState(data.date || '');
    const [time, setTime] = useState(data.time || '');
    const [isRecurring, setIsRecurring] = useState(data.isRecurring || false);

    // Update node data when inputs change
    useEffect(() => {
        if (data.onDataChange) {
            data.onDataChange({ date, time, isRecurring });
        }
    }, [date, time, isRecurring, data]);

    return (
        <div className={`px-4 py-3 shadow-md rounded-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-2 ${
            selected
                ? 'border-blue-500'
                : isDarkMode ? 'border-indigo-700' : 'border-indigo-500'
        }`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                    <Calendar size={18} className="text-indigo-500 mr-2"/>
                    <div className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{data.label}</div>
                </div>
            </div>

            <div className="space-y-2">
                <div>
                    <label
                        className={`block text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className={`w-full text-sm p-1 rounded ${
                            isDarkMode
                                ? 'bg-gray-700 border-gray-600 text-gray-200'
                                : 'border-gray-300 text-gray-700'
                        } border`}
                    />
                </div>

                <div>
                    <label
                        className={`block text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Time</label>
                    <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className={`w-full text-sm p-1 rounded ${
                            isDarkMode
                                ? 'bg-gray-700 border-gray-600 text-gray-200'
                                : 'border-gray-300 text-gray-700'
                        } border`}
                    />
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id={`recurring-${data.id}`}
                        checked={isRecurring}
                        onChange={(e) => setIsRecurring(e.target.checked)}
                        className="mr-2"
                    />
                    <label
                        htmlFor={`recurring-${data.id}`}
                        className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                        Recurring
                    </label>
                </div>
            </div>
        </div>
    );
};

// Agent Node Component
const AgentNode = ({ data, selected }: any) => {
    const { isDarkMode } = useThemeStore();

    const handleOpenClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        // In a real app, this would open a detailed view of the agent
        console.log('Opening agent details:', data.label);
        alert(`Opening details for ${data.label}`);
    };

    return (
        <div className={`px-4 py-3 shadow-md rounded-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border-2 ${
            selected
                ? 'border-blue-500'
                : isDarkMode ? 'border-blue-700' : 'border-blue-500'
        } relative`}>
            <div className="flex items-center">
                <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                    <img
                        src={data.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'}
                        alt={data.label}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div>
                    <div className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>{data.label}</div>
                    <div
                        className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{data.role || 'Agent'}</div>
                </div>

                {/* Open button */}
                <button
                    onClick={handleOpenClick}
                    className={`absolute top-2 right-2 p-1 rounded-md ${
                        isDarkMode
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    } transition-colors`}
                    title="Open agent details"
                >
                    <ExternalLink size={14}/>
                </button>
            </div>
            <div
                className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-2`}>{data.description || 'AI Agent'}</div>
            {data.skills && (
                <div className="mt-2 flex flex-wrap gap-1">
                    {data.skills.map((skill: string, index: number) => (
                        <span
                            key={index}
                            className={`text-xs px-2 py-1 rounded-full ${
                                isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                            }`}
                        >
              {skill}
            </span>
                    ))}
                </div>
            )}
        </div>
    );
};

// Custom Edge Component
const ConnectionEdge = ({ id, source, target, style, markerEnd, data }: any) => {
    const { isDarkMode } = useThemeStore();
    const [showTooltip, setShowTooltip] = useState(false);

    const edgeColor = data?.type === 'collaboration'
        ? '#3b82f6' // blue
        : data?.type === 'data'
            ? '#10b981' // green
            : data?.type === 'approval'
                ? '#f59e0b' // yellow
                : isDarkMode ? '#6b7280' : '#b1b1b7'; // default

    const edgeStyle = {
        ...style,
        stroke: edgeColor,
        strokeWidth: 2,
        strokeDasharray: data?.type === 'approval' ? '5,5' : 'none',
        cursor: 'pointer'
    };

    const labelStyle = {
        fill: isDarkMode ? '#e5e7eb' : '#4b5563',
        fontFamily: 'sans-serif',
        fontSize: 10,
        pointerEvents: 'none'
    };

    return (
        <>
            <path
                id={id}
                style={edgeStyle}
                className="react-flow__edge-path"
                d={`M${source.x},${source.y} C${source.x + 50},${source.y} ${target.x - 50},${target.y} ${target.x},${target.y}`}
                markerEnd={markerEnd}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            />
            {data?.label && (
                <text
                    style={labelStyle}
                    textAnchor="middle"
                    dominantBaseline="central"
                    x={(source.x + target.x) / 2}
                    y={(source.y + target.y) / 2 - 10}
                    dy="-10"
                >
                    {data.label}
                </text>
            )}
            {showTooltip && data?.description && (
                <g transform={`translate(${(source.x + target.x) / 2 - 75}, ${(source.y + target.y) / 2 - 40})`}>
                    <rect
                        x="0"
                        y="0"
                        width="150"
                        height="30"
                        rx="5"
                        ry="5"
                        fill={isDarkMode ? '#374151' : '#f3f4f6'}
                        stroke={isDarkMode ? '#4b5563' : '#d1d5db'}
                        strokeWidth="1"
                    />
                    <text
                        x="75"
                        y="15"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={isDarkMode ? '#e5e7eb' : '#4b5563'}
                        fontSize="10"
                        fontFamily="sans-serif"
                    >
                        {data.description}
                    </text>
                </g>
            )}
        </>
    );
};

// Node types mapping
const nodeTypes: NodeTypes = {
    text: TextNode,
    image: ImageNode,
    database: DatabaseNode,
    api: APINode,
    function: FunctionNode,
    agent: AgentNode,
    schedule: ScheduleNode
};

// Edge types mapping
const edgeTypes: EdgeTypes = {
    custom: ConnectionEdge
};

// Mock agents data
const mockAgents = [
    {
        id: 'agent-1',
        name: 'Sophia',
        role: 'Research Specialist',
        description: 'Expert in data analysis and research synthesis',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        skills: ['Data Analysis', 'Research', 'Report Writing'],
        accuracy: 92,
        type: 'agent'
    },
    {
        id: 'agent-2',
        name: 'Marcus',
        role: 'Financial Analyst',
        description: 'Specializes in financial modeling and forecasting',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        skills: ['Financial Analysis', 'Forecasting', 'Risk Assessment'],
        accuracy: 89,
        type: 'agent'
    },
    {
        id: 'agent-3',
        name: 'Elena',
        role: 'Content Creator',
        description: 'Creates engaging content across multiple platforms',
        avatar: 'https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        skills: ['Content Writing', 'SEO', 'Social Media'],
        accuracy: 87,
        type: 'agent'
    },
    {
        id: 'agent-4',
        name: 'Jamal',
        role: 'Marketing Strategist',
        description: 'Develops comprehensive marketing strategies',
        avatar: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        skills: ['Marketing', 'Analytics', 'Campaign Management'],
        accuracy: 91,
        type: 'agent'
    },
    {
        id: 'agent-5',
        name: 'Aiden',
        role: 'Data Visualization',
        description: 'Creates insightful data visualizations and reports',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        skills: ['Data Visualization', 'Reporting', 'Dashboard Design'],
        accuracy: 94,
        type: 'agent'
    },
    {
        id: 'agent-6',
        name: 'Olivia',
        role: 'Customer Support',
        description: 'Provides exceptional customer service and support',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        skills: ['Customer Service', 'Problem Solving', 'Communication'],
        accuracy: 88,
        type: 'agent'
    },
    {
        id: 'agent-7',
        name: 'Liam',
        role: 'Technical Writer',
        description: 'Creates clear and concise technical documentation',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        skills: ['Technical Writing', 'Documentation', 'Knowledge Base'],
        accuracy: 90,
        type: 'agent'
    },
    {
        id: 'agent-8',
        name: 'Zara',
        role: 'Project Manager',
        description: 'Manages projects from conception to completion',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        skills: ['Project Management', 'Team Leadership', 'Resource Allocation'],
        accuracy: 93,
        type: 'agent'
    }
];

// Connection types for the dropdown
const connectionTypes = [
    { value: 'default', label: 'Default Connection' },
    { value: 'collaboration', label: 'Collaboration' },
    { value: 'data', label: 'Data Transfer' },
    { value: 'approval', label: 'Approval Flow' }
];

// Flow component that uses the ReactFlow hooks
const Flow = () => {
    const { isDarkMode } = useThemeStore();
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [showStartOptions, setShowStartOptions] = useState(true);

    // Custom edge style
    const customEdgeStyle = {
        stroke: isDarkMode ? '#6b7280' : '#b1b1b7',
        strokeWidth: 2,
        animated: true
    };

    const [selectedNodeType, setSelectedNodeType] = useState<string>('agent');
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBySkill, setFilterBySkill] = useState<string | null>(null);
    const [selectedConnectionType, setSelectedConnectionType] = useState('default');
    const [connectionLabel, setConnectionLabel] = useState('');
    const [isAddingConnection, setIsAddingConnection] = useState(false);
    const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
    const [showAgentsSidebar, setShowAgentsSidebar] = useState(false);

    // Toggle agents sidebar
    const toggleAgentsSidebar = () => {
        setShowAgentsSidebar(!showAgentsSidebar);
    };

    // Get all unique skills from agents
    const allSkills = Array.from(
        new Set(mockAgents.flatMap(agent => agent.skills || []))
    );

    // Filter agents based on search term and skill filter
    const filteredAgents = mockAgents.filter(agent => {
        const matchesSearch =
            agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            agent.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
            agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (agent.skills && agent.skills.some(skill =>
                skill.toLowerCase().includes(searchTerm.toLowerCase())
            ));

        const matchesSkill = !filterBySkill ||
            (agent.skills && agent.skills.includes(filterBySkill));

        return matchesSearch && matchesSkill;
    });

    // Update edge styles when dark mode changes
    useEffect(() => {
        setEdges(eds =>
            eds.map(edge => {
                const edgeColor = edge.data?.type === 'collaboration'
                    ? '#3b82f6' // blue
                    : edge.data?.type === 'data'
                        ? '#10b981' // green
                        : edge.data?.type === 'approval'
                            ? '#f59e0b' // yellow
                            : isDarkMode ? '#6b7280' : '#b1b1b7'; // default

                return {
                    ...edge,
                    style: {
                        ...customEdgeStyle,
                        stroke: edgeColor,
                        strokeDasharray: edge.data?.type === 'approval' ? '5,5' : 'none'
                    },
                    markerEnd: {
                        ...edge.markerEnd,
                        color: edgeColor
                    } as any
                };
            })
        );
    }, [isDarkMode]);

    const onNodesChange = useCallback(
        (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    );

    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );

    const onConnect = useCallback(
        (connection: Connection) => {
            // Check if both nodes are agents
            const sourceNode = nodes.find(node => node.id === connection.source);
            const targetNode = nodes.find(node => node.id === connection.target);

            if (sourceNode && targetNode) {
                const edgeColor = selectedConnectionType === 'collaboration'
                    ? '#3b82f6' // blue
                    : selectedConnectionType === 'data'
                        ? '#10b981' // green
                        : selectedConnectionType === 'approval'
                            ? '#f59e0b' // yellow
                            : isDarkMode ? '#6b7280' : '#b1b1b7'; // default

                const newEdge = {
                    ...connection,
                    id: `e${connection.source}-${connection.target}-${Date.now()}`,
                    type: 'custom',
                    animated: true,
                    style: {
                        ...customEdgeStyle,
                        stroke: edgeColor,
                        strokeDasharray: selectedConnectionType === 'approval' ? '5,5' : 'none'
                    },
                    data: {
                        type: selectedConnectionType,
                        label: connectionLabel || getDefaultLabel(selectedConnectionType),
                        description: `Connection from ${sourceNode.data.label} to ${targetNode.data.label}`
                    },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        width: 20,
                        height: 20,
                        color: edgeColor
                    }
                };

                setEdges((eds) => addEdge(newEdge, eds));

                // Reset connection settings
                setConnectionLabel('');
                setSelectedConnectionType('default');
                setIsAddingConnection(false);
            }
        },
        [nodes, isDarkMode, selectedConnectionType, connectionLabel]
    );

    // Get default label based on connection type
    const getDefaultLabel = (type: string) => {
        switch (type) {
            case 'collaboration':
                return 'Collaborates with';
            case 'data':
                return 'Sends data to';
            case 'approval':
                return 'Requires approval from';
            default:
                return 'Connected to';
        }
    };

    const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent<HTMLDivElement>) => {
            event.preventDefault();

            if (!reactFlowInstance) return;

            const type = event.dataTransfer.getData('application/reactflow/type');
            const agentData = event.dataTransfer.getData('application/reactflow/agent');

            if ((!type && !agentData) || !reactFlowInstance) return;

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY
            });

            let newNode;

            if (agentData) {
                // Create agent node
                const agent = JSON.parse(agentData);
                newNode = {
                    id: nanoid(),
                    type: 'agent',
                    position,
                    data: {
                        label: agent.name,
                        role: agent.role,
                        description: agent.description,
                        avatar: agent.avatar,
                        skills: agent.skills,
                        accuracy: agent.accuracy
                    }
                };
            } else {
                // Create regular node
                newNode = {
                    id: nanoid(),
                    type,
                    position,
                    data: {
                        label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
                        description: `Description for ${type} node`
                    }
                };
            }

            setNodes((nds) => nds.concat(newNode));
            setShowStartOptions(false);
        },
        [reactFlowInstance]
    );

    const addNewNode = () => {
        const newNode = {
            id: nanoid(),
            type: selectedNodeType,
            position: {
                x: Math.random() * 500,
                y: Math.random() * 300
            },
            data: {
                label: `New ${selectedNodeType.charAt(0).toUpperCase() + selectedNodeType.slice(1)} Node`,
                description: `Description for ${selectedNodeType} node`
            }
        };

        setNodes((nds) => [...nds, newNode]);
        setShowStartOptions(false);
    };

    // Add schedule node
    const addScheduleNode = () => {
        const id = nanoid();
        const newNode = {
            id,
            type: 'schedule',
            position: {
                x: Math.random() * 500,
                y: Math.random() * 300
            },
            data: {
                id,
                label: 'Schedule',
                date: new Date().toISOString().split('T')[0],
                time: '09:00',
                isRecurring: false,
                onDataChange: (scheduleData: any) => {
                    // Update node data when schedule inputs change
                    setNodes(nds =>
                        nds.map(node =>
                            node.id === id
                                ? { ...node, data: { ...node.data, ...scheduleData } }
                                : node
                        )
                    );
                }
            }
        };

        setNodes((nds) => [...nds, newNode]);
        setShowStartOptions(false);
    };

    const clearCanvas = () => {
        if (window.confirm('Are you sure you want to clear the canvas? This action cannot be undone.')) {
            setNodes([]);
            setEdges([]);
            setShowStartOptions(true);
        }
    };

    const saveFlow = () => {
        if (reactFlowInstance) {
            const flow = reactFlowInstance.toObject();
            localStorage.setItem('savedFlow', JSON.stringify(flow));
            alert('Flow saved successfully!');
        }
    };

    const loadSavedFlow = () => {
        const savedFlow = localStorage.getItem('savedFlow');
        if (savedFlow) {
            const flow = JSON.parse(savedFlow);
            setNodes(flow.nodes || []);
            setEdges(flow.edges || []);
            setShowStartOptions(false);
        }
    };

    const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow/type', nodeType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const onAgentDragStart = (event: React.DragEvent<HTMLDivElement>, agent: any) => {
        event.dataTransfer.setData('application/reactflow/agent', JSON.stringify(agent));
        event.dataTransfer.effectAllowed = 'move';
    };

    // Handle edge click to select it
    const onEdgeClick = (event: React.MouseEvent, edge: Edge) => {
        setSelectedEdge(edge);
    };

    // Update edge properties
    const updateEdge = () => {
        if (selectedEdge) {
            const edgeColor = selectedConnectionType === 'collaboration'
                ? '#3b82f6' // blue
                : selectedConnectionType === 'data'
                    ? '#10b981' // green
                    : selectedConnectionType === 'approval'
                        ? '#f59e0b' // yellow
                        : isDarkMode ? '#6b7280' : '#b1b1b7'; // default

            setEdges(eds =>
                eds.map(edge => {
                    if (edge.id === selectedEdge.id) {
                        return {
                            ...edge,
                            data: {
                                ...edge.data,
                                type: selectedConnectionType,
                                label: connectionLabel || getDefaultLabel(selectedConnectionType)
                            },
                            style: {
                                ...edge.style,
                                stroke: edgeColor,
                                strokeDasharray: selectedConnectionType === 'approval' ? '5,5' : 'none'
                            },
                            markerEnd: {
                                ...edge.markerEnd,
                                color: edgeColor
                            } as any
                        };
                    }
                    return edge;
                })
            );

            // Reset
            setSelectedEdge(null);
            setConnectionLabel('');
            setSelectedConnectionType('default');
        }
    };

    // Delete selected edge
    const deleteSelectedEdge = () => {
        if (selectedEdge) {
            setEdges(eds => eds.filter(edge => edge.id !== selectedEdge.id));
            setSelectedEdge(null);
        }
    };

    // Start from prompt
    const startFromPrompt = () => {
        setShowStartOptions(false);
        // In a real app, this would open a prompt input
        setTimeout(() => {
            const newNode = {
                id: nanoid(),
                type: 'agent',
                position: { x: 250, y: 100 },
                data: {
                    label: 'Sophia',
                    role: 'Research Specialist',
                    description: 'Expert in data analysis and research synthesis',
                    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
                    skills: ['Data Analysis', 'Research', 'Report Writing']
                }
            };
            setNodes([newNode]);
        }, 100);
    };

    // Start from template
    const startFromTemplate = () => {
        setShowStartOptions(false);
        // In a real app, this would load a template
        setTimeout(() => {
            setNodes([
                {
                    id: '1',
                    type: 'agent',
                    position: { x: 250, y: 100 },
                    data: {
                        label: 'Sophia',
                        role: 'Research Specialist',
                        description: 'Expert in data analysis and research synthesis',
                        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
                        skills: ['Data Analysis', 'Research', 'Report Writing']
                    }
                },
                {
                    id: '2',
                    type: 'agent',
                    position: { x: 250, y: 250 },
                    data: {
                        label: 'Marcus',
                        role: 'Financial Analyst',
                        description: 'Specializes in financial modeling and forecasting',
                        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
                        skills: ['Financial Analysis', 'Forecasting', 'Risk Assessment']
                    }
                },
                {
                    id: '3',
                    type: 'agent',
                    position: { x: 500, y: 175 },
                    data: {
                        label: 'Elena',
                        role: 'Content Creator',
                        description: 'Creates engaging content across multiple platforms',
                        avatar: 'https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
                        skills: ['Content Writing', 'SEO', 'Social Media']
                    }
                }
            ]);

            setEdges([
                {
                    id: 'e1-2',
                    source: '1',
                    target: '2',
                    type: 'custom',
                    animated: true,
                    style: customEdgeStyle,
                    data: {
                        type: 'collaboration',
                        label: 'Collaborates with',
                        description: 'Research data for financial analysis'
                    },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        width: 20,
                        height: 20,
                        color: '#3b82f6' // blue for collaboration
                    }
                },
                {
                    id: 'e2-3',
                    source: '2',
                    target: '3',
                    type: 'custom',
                    animated: true,
                    style: customEdgeStyle,
                    data: {
                        type: 'data',
                        label: 'Provides data to',
                        description: 'Financial insights for content'
                    },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        width: 20,
                        height: 20,
                        color: '#10b981' // green for data
                    }
                }
            ]);
        }, 100);
    };

    // Start from scratch
    const startFromScratch = () => {
        setShowStartOptions(false);
    };

    // Suppress ResizeObserver errors
    useEffect(() => {
        const originalError = console.error;
        console.error = (...args) => {
            if (args[0]?.includes?.('ResizeObserver loop')) {
                return;
            }
            originalError(...args);
        };

        return () => {
            console.error = originalError;
        };
    }, []);

    // Load saved flow on mount
    useEffect(() => {
        const savedFlow = localStorage.getItem('savedFlow');
        if (savedFlow) {
            try {
                const flow = JSON.parse(savedFlow);
                if (flow.nodes && flow.nodes.length > 0 && flow.edges) {
                    setNodes(flow.nodes);
                    setEdges(flow.edges);
                    setShowStartOptions(false);
                }
            } catch (error) {
                console.error('Failed to load saved flow:', error);
            }
        }
    }, []);

    // Set connection properties when selecting an edge
    useEffect(() => {
        if (selectedEdge) {
            setSelectedConnectionType(selectedEdge.data?.type || 'default');
            setConnectionLabel(selectedEdge.data?.label || '');
        }
    }, [selectedEdge]);

    // Listen for toolbar button clicks
    useEffect(() => {
        const addAgentButton = document.getElementById('add-agent-button');
        const scheduleButton = document.getElementById('schedule-button');

        if (addAgentButton) {
            addAgentButton.addEventListener('click', toggleAgentsSidebar);
        }

        if (scheduleButton) {
            scheduleButton.addEventListener('click', addScheduleNode);
        }

        return () => {
            if (addAgentButton) {
                addAgentButton.removeEventListener('click', toggleAgentsSidebar);
            }

            if (scheduleButton) {
                scheduleButton.removeEventListener('click', addScheduleNode);
            }
        };
    }, []);

    return (
        <div className="h-full flex flex-col">
            <div
                className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-4 border-b flex justify-between items-center`}>
                <div className="flex items-center space-x-2">
                    <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : ''}`}>Flow Designer</h2>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                <div ref={reactFlowWrapper} className="flex-1">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onInit={setReactFlowInstance}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        onEdgeClick={onEdgeClick}
                        fitView
                        attributionPosition="bottom-right"
                        connectionLineType={ConnectionLineType.SmoothStep}
                        defaultEdgeOptions={{
                            type: 'custom',
                            animated: true
                        }}
                    >
                        <Background color={isDarkMode ? '#4b5563' : '#aaa'} gap={16}/>
                        <Controls/>
                        <MiniMap
                            nodeStrokeWidth={3}
                            zoomable
                            pannable
                            nodeBorderRadius={2}
                            nodeColor={(node) => {
                                if (isDarkMode) {
                                    switch (node.type) {
                                        case 'database':
                                            return '#065f46';
                                        case 'api':
                                            return '#5b21b6';
                                        case 'function':
                                            return '#92400e';
                                        case 'agent':
                                            return '#1e40af';
                                        case 'schedule':
                                            return '#4f46e5';
                                        default:
                                            return '#374151';
                                    }
                                } else {
                                    switch (node.type) {
                                        case 'database':
                                            return '#10b981';
                                        case 'api':
                                            return '#8b5cf6';
                                        case 'function':
                                            return '#f59e0b';
                                        case 'agent':
                                            return '#3b82f6';
                                        case 'schedule':
                                            return '#6366f1';
                                        default:
                                            return '#e5e7eb';
                                    }
                                }
                            }}
                            style={{
                                backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb'
                            }}
                        />

                        {/* Start options overlay */}
                        {showStartOptions && (
                            <div
                                className="absolute inset-0 flex items-center justify-center bg-opacity-50 bg-gray-900 z-10">
                                <div className={`grid grid-cols-3 gap-8 p-8 max-w-5xl`}>
                                    {/* Prompt Card */}
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl`}
                                        onClick={startFromPrompt}
                                    >
                                        <div
                                            className={`h-48 flex items-center justify-center ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                                            <MessageSquare size={80}
                                                           className={`${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`}/>
                                        </div>
                                        <div className="p-6">
                                            <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Prompt</h3>
                                            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                Describe what you want to build and let AI create a flow for you.
                                            </p>
                                        </div>
                                    </motion.div>

                                    {/* Template Card */}
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl`}
                                        onClick={startFromTemplate}
                                    >
                                        <div
                                            className={`h-48 flex items-center justify-center ${isDarkMode ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
                                            <Copy size={80}
                                                  className={`${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`}/>
                                        </div>
                                        <div className="p-6">
                                            <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>From
                                                Template</h3>
                                            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                Start with a pre-built template and customize it to your needs.
                                            </p>
                                        </div>
                                    </motion.div>

                                    {/* From Scratch Card */}
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl`}
                                        onClick={startFromScratch}
                                    >
                                        <div
                                            className={`h-48 flex items-center justify-center ${isDarkMode ? 'bg-green-900/30' : 'bg-green-50'}`}>
                                            <FileCode size={80}
                                                      className={`${isDarkMode ? 'text-green-400' : 'text-green-500'}`}/>
                                        </div>
                                        <div className="p-6">
                                            <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>From
                                                Scratch</h3>
                                            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                Build your flow from scratch with complete creative freedom.
                                            </p>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        )}

                        {/* Connection settings panel */}
                        {selectedEdge && (
                            <Panel position="top-center" className="mt-2">
                                <div
                                    className={`p-3 rounded-md shadow-md ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
                                    <div className="flex items-center mb-2">
                                        <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Edit
                                            Connection</h3>
                                    </div>
                                    <div className="flex items-center space-x-2 mb-2">
                                        <select
                                            className={`border rounded-md text-sm p-1 ${
                                                isDarkMode
                                                    ? 'bg-gray-700 border-gray-600 text-gray-200'
                                                    : 'border-gray-300'
                                            }`}
                                            value={selectedConnectionType}
                                            onChange={(e) => setSelectedConnectionType(e.target.value)}
                                        >
                                            {connectionTypes.map((type) => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="text"
                                            placeholder="Connection label"
                                            value={connectionLabel}
                                            onChange={(e) => setConnectionLabel(e.target.value)}
                                            className={`border rounded-md text-sm p-1 ${
                                                isDarkMode
                                                    ? 'bg-gray-700 border-gray-600 text-gray-200'
                                                    : 'border-gray-300'
                                            }`}
                                        />
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSelectedEdge(null)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={deleteSelectedEdge}
                                        >
                                            Delete
                                        </Button>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={updateEdge}
                                        >
                                            Update
                                        </Button>
                                    </div>
                                </div>
                            </Panel>
                        )}

                        {/* Connection type panel when adding a new connection */}
                        {isAddingConnection && !selectedEdge && (
                            <Panel position="top-center" className="mt-2">
                                <div
                                    className={`p-3 rounded-md shadow-md ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
                                    <div className="flex items-center mb-2">
                                        <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>New
                                            Connection</h3>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <select
                                            className={`border rounded-md text-sm p-1 ${
                                                isDarkMode
                                                    ? 'bg-gray-700 border-gray-600 text-gray-200'
                                                    : 'border-gray-300'
                                            }`}
                                            value={selectedConnectionType}
                                            onChange={(e) => setSelectedConnectionType(e.target.value)}
                                        >
                                            {connectionTypes.map((type) => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="text"
                                            placeholder="Connection label (optional)"
                                            value={connectionLabel}
                                            onChange={(e) => setConnectionLabel(e.target.value)}
                                            className={`border rounded-md text-sm p-1 ${
                                                isDarkMode
                                                    ? 'bg-gray-700 border-gray-600 text-gray-200'
                                                    : 'border-gray-300'
                                            }`}
                                        />
                                    </div>
                                </div>
                            </Panel>
                        )}
                    </ReactFlow>
                </div>

                {/* Agents sidebar - sliding panel */}
                <AnimatePresence>
                    {showAgentsSidebar && (
                        <motion.div
                            initial={{ x: '100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className={`absolute top-0 right-0 h-full w-72 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-l p-4 overflow-y-auto z-10`}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center`}>
                                    <Users size={16} className="mr-2"/>
                                    Agents
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={toggleAgentsSidebar}
                                    aria-label="Close agents panel"
                                >
                                    &times;
                                </Button>
                            </div>

                            {/* Search input */}
                            <div className="mb-3">
                                <Input
                                    placeholder="Search agents..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    leftIcon={<Search size={16}
                                                      className={isDarkMode ? 'text-gray-400' : 'text-gray-400'}/>}
                                />
                            </div>

                            {/* Skill filter */}
                            <div className="mb-4">
                                <div className="relative">
                                    <select
                                        className={`w-full pl-3 pr-10 py-2 text-xs ${
                                            isDarkMode
                                                ? 'bg-gray-700 border-gray-600 text-gray-200 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                                                : 'border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500'
                                        } rounded-md`}
                                        value={filterBySkill || ''}
                                        onChange={(e) => setFilterBySkill(e.target.value || null)}
                                    >
                                        <option value="">All Skills</option>
                                        {allSkills.map((skill) => (
                                            <option key={skill} value={skill}>
                                                {skill}
                                            </option>
                                        ))}
                                    </select>
                                    <div
                                        className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                        <Filter size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-400'}/>
                                    </div>
                                </div>
                            </div>

                            {/* Agents list */}
                            <div className="space-y-3">
                                {filteredAgents.length === 0 ? (
                                    <div
                                        className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        No agents found matching your criteria
                                    </div>
                                ) : (
                                    filteredAgents.map((agent) => (
                                        <div
                                            key={agent.id}
                                            className={`p-3 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} rounded-md border cursor-grab shadow-sm hover:shadow-md transition-shadow`}
                                            onDragStart={(event) => onAgentDragStart(event, agent)}
                                            draggable
                                        >
                                            <div className="flex items-center mb-2">
                                                <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
                                                    <img
                                                        src={agent.avatar}
                                                        alt={agent.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <div
                                                        className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : ''}`}>{agent.name}</div>
                                                    <div
                                                        className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{agent.role}</div>
                                                </div>
                                            </div>

                                            {/* Skills tags */}
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {agent.skills.map((skill, index) => (
                                                    <span
                                                        key={index}
                                                        className={`text-xs px-1.5 py-0.5 rounded-full ${
                                                            isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-700'
                                                        }`}
                                                    >
                            {skill}
                          </span>
                                                ))}
                                            </div>

                                            {/* Accuracy indicator */}
                                            <div className="flex items-center mt-2">
                                                <Star size={12} className="text-yellow-500 mr-1"/>
                                                <span
                                                    className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {agent.accuracy}% accuracy
                        </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="mt-6">
                                <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>Instructions</h3>
                                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} space-y-2`}>
                                    <p>• Drag agents from this panel to add them to the canvas</p>
                                    <p>• Connect agents by dragging from one handle to another</p>
                                    <p>• Click on connections to edit their properties</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

// Main Office component that wraps Flow with ReactFlowProvider
export const Office: React.FC = () => {
    const { isDarkMode } = useThemeStore();

    return (
        <div className="h-[calc(100vh-32px)]">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`h-full w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg overflow-hidden shadow-sm ${
                    isDarkMode ? 'border-gray-700' : 'border-gray-200'
                } border`}
            >
                <ReactFlowProvider>
                    <Flow/>
                </ReactFlowProvider>
            </motion.div>
        </div>
    );
};