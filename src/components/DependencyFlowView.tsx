import { useEffect, useState, useCallback, useMemo } from 'react';
import { Board, Task } from '@/types/kanban';
import { Pencil, ListTree, Calendar, Link2, ClipboardCheck, ArrowRight } from 'lucide-react';

interface DependencyFlowViewProps {
  board: Board;
}

interface FlowNode {
  task: Task;
  column: string;
  level: number;
  dependents: string[];
}

const iconMap = {
  design: Pencil,
  code: ListTree,
  planning: Calendar,
  dependency: Link2,
  requirements: ClipboardCheck,
};

const columnColors: Record<string, string> = {
  todo: 'from-amber-500/20 to-amber-600/20 border-amber-500/40',
  'in-progress': 'from-blue-500/20 to-blue-600/20 border-blue-500/40',
  done: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/40',
};

const columnLabels: Record<string, string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
};

export const DependencyFlowView = ({ board }: DependencyFlowViewProps) => {
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  // Build dependency graph
  const { nodes, connections } = useMemo(() => {
    const nodeMap = new Map<string, FlowNode>();
    const allConnections: { from: string; to: string }[] = [];

    // Create nodes for all tasks
    board.columns.forEach((column) => {
      column.tasks.forEach((task) => {
        nodeMap.set(task.id, {
          task,
          column: column.id,
          level: 0,
          dependents: [],
        });
      });
    });

    // Build connections and find dependents
    board.columns.forEach((column) => {
      column.tasks.forEach((task) => {
        if (task.dependsOn) {
          task.dependsOn.forEach((depId) => {
            allConnections.push({ from: depId, to: task.id });
            const depNode = nodeMap.get(depId);
            if (depNode) {
              depNode.dependents.push(task.id);
            }
          });
        }
      });
    });

    // Calculate levels (tasks with no dependencies = level 0)
    const calculateLevels = () => {
      const visited = new Set<string>();
      const getLevel = (taskId: string): number => {
        if (visited.has(taskId)) return nodeMap.get(taskId)?.level || 0;
        visited.add(taskId);
        
        const node = nodeMap.get(taskId);
        if (!node) return 0;
        
        const deps = node.task.dependsOn || [];
        if (deps.length === 0) {
          node.level = 0;
          return 0;
        }
        
        const maxDepLevel = Math.max(...deps.map(getLevel));
        node.level = maxDepLevel + 1;
        return node.level;
      };

      nodeMap.forEach((_, taskId) => getLevel(taskId));
    };

    calculateLevels();

    return { nodes: Array.from(nodeMap.values()), connections: allConnections };
  }, [board]);

  // Group nodes by level
  const nodesByLevel = useMemo(() => {
    const levels: FlowNode[][] = [];
    nodes.forEach((node) => {
      if (!levels[node.level]) {
        levels[node.level] = [];
      }
      levels[node.level].push(node);
    });
    return levels;
  }, [nodes]);

  const isHighlighted = (taskId: string) => {
    if (!hoveredTask) return false;
    if (taskId === hoveredTask) return true;
    
    const hoveredNode = nodes.find((n) => n.task.id === hoveredTask);
    if (!hoveredNode) return false;
    
    // Highlight dependencies
    if (hoveredNode.task.dependsOn?.includes(taskId)) return true;
    
    // Highlight dependents
    if (hoveredNode.dependents.includes(taskId)) return true;
    
    return false;
  };

  const isConnectionHighlighted = (from: string, to: string) => {
    if (!hoveredTask) return false;
    return (from === hoveredTask || to === hoveredTask);
  };

  return (
    <div className="p-8 min-h-[600px]">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-2">Dependency Flow</h2>
        <p className="text-muted-foreground text-sm">
          Visualize how tasks depend on each other. Hover to highlight connections.
        </p>
      </div>

      {/* Legend */}
      <div className="flex gap-6 mb-8">
        {Object.entries(columnLabels).map(([key, label]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded bg-gradient-to-br ${columnColors[key]} border`} />
            <span className="text-sm text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Flow Diagram */}
      <div className="relative">
        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          {connections.map((conn, idx) => {
            const fromEl = document.querySelector(`[data-flow-id="${conn.from}"]`);
            const toEl = document.querySelector(`[data-flow-id="${conn.to}"]`);
            
            if (!fromEl || !toEl) return null;
            
            const container = document.querySelector('.flow-container');
            if (!container) return null;
            
            const containerRect = container.getBoundingClientRect();
            const fromRect = fromEl.getBoundingClientRect();
            const toRect = toEl.getBoundingClientRect();
            
            const fromX = fromRect.right - containerRect.left;
            const fromY = fromRect.top - containerRect.top + fromRect.height / 2;
            const toX = toRect.left - containerRect.left;
            const toY = toRect.top - containerRect.top + toRect.height / 2;
            
            const midX = (fromX + toX) / 2;
            const path = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
            
            const highlighted = isConnectionHighlighted(conn.from, conn.to);
            
            return (
              <path
                key={`${conn.from}-${conn.to}-${idx}`}
                d={path}
                fill="none"
                stroke={highlighted ? 'hsl(210 80% 60%)' : 'hsl(210 30% 50% / 0.4)'}
                strokeWidth={highlighted ? 3 : 2}
                markerEnd="url(#flow-arrow)"
                className="transition-all duration-200"
              />
            );
          })}
          <defs>
            <marker
              id="flow-arrow"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="hsl(210 30% 60%)" />
            </marker>
          </defs>
        </svg>

        {/* Nodes by level */}
        <div className="flow-container flex gap-16 items-start relative" style={{ zIndex: 1 }}>
          {nodesByLevel.map((levelNodes, levelIdx) => (
            <div key={levelIdx} className="flex flex-col gap-4">
              <div className="text-xs text-muted-foreground/60 text-center mb-2">
                {levelIdx === 0 ? 'Independent' : `Level ${levelIdx}`}
              </div>
              {levelNodes.map((node) => {
                const Icon = iconMap[node.task.icon];
                const highlighted = isHighlighted(node.task.id);
                const hasDependencies = (node.task.dependsOn?.length || 0) > 0;
                const hasDependents = node.dependents.length > 0;
                
                return (
                  <div
                    key={node.task.id}
                    data-flow-id={node.task.id}
                    onMouseEnter={() => setHoveredTask(node.task.id)}
                    onMouseLeave={() => setHoveredTask(null)}
                    className={`
                      relative p-4 rounded-xl border-2 min-w-[200px] cursor-pointer
                      bg-gradient-to-br ${columnColors[node.column]}
                      transition-all duration-200
                      ${highlighted ? 'scale-105 shadow-xl border-primary/60' : 'hover:scale-102'}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-foreground/10">
                        <Icon className="w-4 h-4 text-foreground/80" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground text-sm">
                          {node.task.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {node.task.description}
                        </p>
                        {node.task.assignee && (
                          <p className="text-xs text-muted-foreground/70 mt-2">
                            {node.task.assignee}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Dependency indicators */}
                    <div className="flex gap-2 mt-3 pt-2 border-t border-foreground/10">
                      {hasDependencies && (
                        <span className="text-xs text-muted-foreground bg-foreground/5 px-2 py-0.5 rounded">
                          {node.task.dependsOn?.length} dep{node.task.dependsOn?.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {hasDependents && (
                        <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {node.dependents.length} blocking
                        </span>
                      )}
                      {!hasDependencies && !hasDependents && (
                        <span className="text-xs text-muted-foreground/60">
                          No dependencies
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-12 grid grid-cols-3 gap-4 max-w-xl">
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{nodes.length}</div>
          <div className="text-sm text-muted-foreground">Total Tasks</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{connections.length}</div>
          <div className="text-sm text-muted-foreground">Dependencies</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-foreground">
            {nodes.filter((n) => n.dependents.length > 0).length}
          </div>
          <div className="text-sm text-muted-foreground">Blocking Tasks</div>
        </div>
      </div>
    </div>
  );
};
