import { useMemo, useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Handle,
  Position,
  NodeProps,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { Board, Task } from '@/types/kanban';
import { Pencil, ListTree, Calendar, Link2, ClipboardCheck } from 'lucide-react';

interface DependencyFlowViewProps {
  board: Board;
}

function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 80, ranksep: 160 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: 260, height: 130 });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: { x: pos.x - 130, y: pos.y - 65 },
    };
  });

  return { nodes: layoutedNodes, edges };
}

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  'To Do': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  'In Progress': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400' },
  'Done': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  design: Pencil,
  code: ListTree,
  planning: Calendar,
  dependency: Link2,
  requirements: ClipboardCheck,
};

type TaskNodeData = {
  label: string;
  task: Task;
  columnTitle: string;
  depCount: number;
  blockingCount: number;
};

function TaskFlowNode({ data }: NodeProps<Node<TaskNodeData>>) {
  const { task, columnTitle, depCount, blockingCount } = data;
  const Icon = iconMap[task.icon] || Calendar;
  const status = statusColors[columnTitle] || statusColors['To Do'];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 w-[260px] cursor-default hover:shadow-md transition-shadow">
      <Handle type="target" position={Position.Left} className="!bg-blue-500 !w-2.5 !h-2.5 !border-2 !border-white" />

      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-gray-100 flex-shrink-0">
          <Icon className="w-3.5 h-3.5 text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-sm leading-tight truncate">{task.title}</h4>
          <div className={`inline-flex items-center gap-1.5 mt-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {columnTitle}
          </div>
        </div>
      </div>

      {task.assignee && (
        <p className="text-xs text-gray-500 mt-2 truncate">{task.assignee}</p>
      )}

      {(depCount > 0 || blockingCount > 0) && (
        <div className="flex gap-2 mt-2.5 pt-2.5 border-t border-gray-100">
          {depCount > 0 && (
            <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
              {depCount} dep{depCount !== 1 ? 's' : ''}
            </span>
          )}
          {blockingCount > 0 && (
            <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
              {blockingCount} blocking
            </span>
          )}
        </div>
      )}

      <Handle type="source" position={Position.Right} className="!bg-blue-500 !w-2.5 !h-2.5 !border-2 !border-white" />
    </div>
  );
}

const nodeTypes = { taskNode: TaskFlowNode };

function FlowInner({ board }: DependencyFlowViewProps) {
  const [highlightedEdges, setHighlightedEdges] = useState<Set<string>>(new Set());

  const { initialNodes, initialEdges, totalTasks, totalDeps, blockingCount } = useMemo(() => {
    const nodes: Node<TaskNodeData>[] = [];
    const edges: Edge[] = [];
    const dependentsMap = new Map<string, number>();
    let totalDeps = 0;

    board.columns.forEach((col) => {
      col.tasks.forEach((task) => {
        if (task.dependsOn) {
          task.dependsOn.forEach((depId) => {
            dependentsMap.set(depId, (dependentsMap.get(depId) || 0) + 1);
          });
        }
      });
    });

    board.columns.forEach((col) => {
      col.tasks.forEach((task) => {
        nodes.push({
          id: task.id,
          type: 'taskNode',
          position: { x: 0, y: 0 },
          data: {
            label: task.title,
            task,
            columnTitle: col.title,
            depCount: task.dependsOn?.length || 0,
            blockingCount: dependentsMap.get(task.id) || 0,
          },
        });

        if (task.dependsOn) {
          task.dependsOn.forEach((depId) => {
            edges.push({
              id: `${depId}->${task.id}`,
              source: depId,
              target: task.id,
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#3b82f6', strokeWidth: 2 },
            });
            totalDeps++;
          });
        }
      });
    });

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    const blocking = Array.from(dependentsMap.values()).filter((v) => v > 0).length;

    return {
      initialNodes: layoutedNodes,
      initialEdges: layoutedEdges,
      totalTasks: nodes.length,
      totalDeps,
      blockingCount: blocking,
    };
  }, [board]);

  const onNodeMouseEnter = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const connected = new Set<string>();
      initialEdges.forEach((e) => {
        if (e.source === node.id || e.target === node.id) {
          connected.add(e.id);
        }
      });
      setHighlightedEdges(connected);
    },
    [initialEdges]
  );

  const onNodeMouseLeave = useCallback(() => {
    setHighlightedEdges(new Set());
  }, []);

  const styledEdges = useMemo(() => {
    if (highlightedEdges.size === 0) return initialEdges;
    return initialEdges.map((e) => ({
      ...e,
      style: highlightedEdges.has(e.id)
        ? { stroke: '#2563eb', strokeWidth: 3 }
        : { stroke: '#cbd5e1', strokeWidth: 1.5 },
    }));
  }, [initialEdges, highlightedEdges]);

  return (
    <>
      {/* ReactFlow canvas — uses flex-1 to fill remaining viewport, with absolute inner to give pixel dimensions */}
      <div className="flex-1 relative min-h-0">
        <div className="absolute inset-0">
          <ReactFlow
            nodes={initialNodes}
            edges={styledEdges}
            nodeTypes={nodeTypes}
            onNodeMouseEnter={onNodeMouseEnter}
            onNodeMouseLeave={onNodeMouseLeave}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            proOptions={{ hideAttribution: true }}
            minZoom={0.3}
            maxZoom={1.5}
          >
            <Background color="#e2e8f0" gap={24} size={1} />
            <Controls
              className="!bg-white !border-gray-200 !rounded-lg !shadow-sm [&>button]:!bg-white [&>button]:!border-gray-200 [&>button]:!text-gray-600 [&>button:hover]:!bg-gray-50"
            />
            <MiniMap
              nodeColor="#3b82f6"
              maskColor="rgba(255,255,255,0.85)"
              className="!bg-white !border-gray-200 !rounded-lg !shadow-sm"
            />
          </ReactFlow>
        </div>
      </div>

      {/* Stats bar */}
      <div className="shrink-0 grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-4 max-w-xl mx-auto w-full">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 text-center">
          <div className="text-xl font-bold text-foreground">{totalTasks}</div>
          <div className="text-xs text-muted-foreground">Total Tasks</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 text-center">
          <div className="text-xl font-bold text-primary">{totalDeps}</div>
          <div className="text-xs text-muted-foreground">Dependencies</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 text-center">
          <div className="text-xl font-bold text-amber-600">{blockingCount}</div>
          <div className="text-xs text-muted-foreground">Blocking Tasks</div>
        </div>
      </div>
    </>
  );
}

export const DependencyFlowView = ({ board }: DependencyFlowViewProps) => (
  <ReactFlowProvider>
    <FlowInner board={board} />
  </ReactFlowProvider>
);
