import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { KanbanCard } from './KanbanCard';
import { useUserRole } from '@/hooks/useUserRole';
import { cn } from '@/lib/utils';

interface SortableKanbanCardProps {
  project: any;
  onClick?: () => void;
  onDelete?: (projectId: string) => void;
}

export function SortableKanbanCard({ project, onClick, onDelete }: SortableKanbanCardProps) {
  const { role } = useUserRole();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const shouldPulse = project.status === 'review';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
    >
      {/* Handle de drag */}
      <button
        {...listeners}
        {...attributes}
        className="absolute top-2 right-2 z-10 p-1 opacity-0 group-hover:opacity-50 hover:!opacity-100 cursor-grab active:cursor-grabbing transition-opacity rounded hover:bg-accent"
        aria-label="Arrastar projeto"
        type="button"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      <KanbanCard
        project={project}
        onClick={onClick}
        onDelete={onDelete}
        isDragging={isDragging}
        className={cn(
          shouldPulse && "ring-2 ring-orange-500 ring-offset-2 animate-pulse"
        )}
      />
    </div>
  );
}
