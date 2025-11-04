import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { KanbanCard } from './KanbanCard';
import { useUserRole } from '@/hooks/useUserRole';
import { cn } from '@/lib/utils';

interface SortableKanbanCardProps {
  project: any;
  onClick?: () => void;
}

export function SortableKanbanCard({ project, onClick }: SortableKanbanCardProps) {
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

  const shouldPulse = role === 'ceo' && project.status === 'review';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <KanbanCard
        project={project}
        onClick={onClick}
        isDragging={isDragging}
        className={cn(
          shouldPulse && "ring-2 ring-orange-500 ring-offset-2 animate-pulse"
        )}
      />
    </div>
  );
}
