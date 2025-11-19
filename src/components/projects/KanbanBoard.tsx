import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Lightbulb, FileText, Clock, PlayCircle, CheckCircle2, Archive } from 'lucide-react';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { useProjectTransitions } from '@/hooks/useProjectTransitions';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import { SortableKanbanCard } from './SortableKanbanCard';

type ProjectStatus = Database['public']['Enums']['project_status'];

interface KanbanBoardProps {
  projectsByStatus: Record<ProjectStatus, any[]>;
  onProjectClick: (project: any) => void;
}

const STATUS_COLUMNS = [
  { id: 'idea' as ProjectStatus, title: 'Ideias', icon: Lightbulb },
  { id: 'draft' as ProjectStatus, title: 'Detalhamento', icon: FileText },
  { id: 'review' as ProjectStatus, title: 'Em Análise', icon: Clock },
  { id: 'approved' as ProjectStatus, title: 'Em Andamento', icon: PlayCircle },
  { id: 'completed' as ProjectStatus, title: 'Finalizados', icon: CheckCircle2 },
  { id: 'archived' as ProjectStatus, title: 'Arquivados', icon: Archive }
];

export function KanbanBoard({ projectsByStatus, onProjectClick }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const { canTransition, transition } = useProjectTransitions();
  const { role } = useUserRole();
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const projectId = active.id as string;
    const newStatus = over.id as ProjectStatus;

    // Find the project
    let project: any;
    let fromStatus: ProjectStatus | undefined;
    
    for (const [status, projects] of Object.entries(projectsByStatus)) {
      const found = projects.find(p => p.id === projectId);
      if (found) {
        project = found;
        fromStatus = status as ProjectStatus;
        break;
      }
    }

    if (!project || !fromStatus) return;

    // Check if transition is allowed
    const validation = canTransition(fromStatus, newStatus, project);
    
    if (!validation.allowed) {
      toast({
        title: 'Transição não permitida',
        description: validation.reason,
        variant: 'destructive'
      });
      return;
    }

    // Perform transition
    transition({ 
      projectId, 
      newStatus,
      comment: undefined 
    });
  };

  const activeProject = activeId 
    ? Object.values(projectsByStatus).flat().find(p => p.id === activeId)
    : null;

  const reviewCount = projectsByStatus.review?.length || 0;

  return (
    <DndContext 
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUS_COLUMNS.map((column) => {
          const projects = projectsByStatus[column.id] || [];
          const badge = role === 'ceo' && column.id === 'review' ? reviewCount : undefined;

          return (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              icon={column.icon}
              projects={projects}
              badge={badge}
              badgeVariant="destructive"
            >
              {projects.map((project) => (
                <SortableKanbanCard
                  key={project.id}
                  project={project}
                  onClick={() => onProjectClick(project)}
                />
              ))}
            </KanbanColumn>
          );
        })}
      </div>

      <DragOverlay>
        {activeProject ? (
          <KanbanCard
            project={activeProject}
            isDragging
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
