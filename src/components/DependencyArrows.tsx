import { useEffect, useState, useCallback } from 'react';
import { Board } from '@/types/kanban';

interface DependencyArrowsProps {
  board: Board;
}

interface ArrowPath {
  from: string;
  to: string;
  path: string;
}

export const DependencyArrows = ({ board }: DependencyArrowsProps) => {
  const [arrows, setArrows] = useState<ArrowPath[]>([]);

  const calculateArrows = useCallback(() => {
    const newArrows: ArrowPath[] = [];

    board.columns.forEach((column) => {
      column.tasks.forEach((task) => {
        if (task.dependsOn && task.dependsOn.length > 0) {
          task.dependsOn.forEach((dependencyId) => {
            const fromEl = document.querySelector(`[data-task-id="${dependencyId}"]`);
            const toEl = document.querySelector(`[data-task-id="${task.id}"]`);

            if (fromEl && toEl) {
              const fromRect = fromEl.getBoundingClientRect();
              const toRect = toEl.getBoundingClientRect();
              const container = document.getElementById('kanban-container');
              
              if (container) {
                const containerRect = container.getBoundingClientRect();
                
                const fromX = fromRect.left - containerRect.left + fromRect.width / 2;
                const fromY = fromRect.top - containerRect.top;
                const toX = toRect.left - containerRect.left + toRect.width / 2;
                const toY = toRect.bottom - containerRect.top;

                // Create curved arrow path pointing upward
                const midY = (fromY + toY) / 2;
                const path = `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;

                newArrows.push({
                  from: dependencyId,
                  to: task.id,
                  path,
                });
              }
            }
          });
        }
      });
    });

    setArrows(newArrows);
  }, [board]);

  useEffect(() => {
    // Calculate initial arrows
    const timer = setTimeout(calculateArrows, 100);
    
    // Recalculate on window resize
    window.addEventListener('resize', calculateArrows);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateArrows);
    };
  }, [calculateArrows]);

  // Recalculate when board changes
  useEffect(() => {
    calculateArrows();
  }, [board, calculateArrows]);

  return (
    <svg
      className="absolute inset-0 pointer-events-none overflow-visible"
      style={{ zIndex: 10 }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill="hsl(210 30% 85%)"
          />
        </marker>
      </defs>
      {arrows.map((arrow, index) => (
        <path
          key={`${arrow.from}-${arrow.to}-${index}`}
          d={arrow.path}
          className="dependency-line"
          markerEnd="url(#arrowhead)"
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
          }}
        />
      ))}
    </svg>
  );
};
