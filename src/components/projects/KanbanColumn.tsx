import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { LucideIcon } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type ProjectStatus = Database['public']['Enums']['project_status'];

interface KanbanColumnProps {
  id: ProjectStatus;
  title: string;
  icon: LucideIcon;
  projects: any[];
  badge?: number;
  badgeVariant?: 'default' | 'destructive' | 'secondary';
  children?: React.ReactNode;
}

export function KanbanColumn({ 
  id, 
  title, 
  icon: Icon, 
  projects, 
  badge, 
  badgeVariant = 'secondary',
  children 
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "flex flex-col bg-muted/30 rounded-lg p-4 min-w-[280px] transition-colors",
        isOver && "bg-muted/50 ring-2 ring-primary"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-sm">{title}</h3>
          <Badge variant="secondary" className="text-xs">
            {projects.length}
          </Badge>
        </div>
        
        {badge !== undefined && badge > 0 && (
          <Badge variant={badgeVariant} className="h-6 w-6 p-0 flex items-center justify-center">
            {badge}
          </Badge>
        )}
      </div>

      {/* Projects */}
      <ScrollArea className="flex-1 pr-2">
        <SortableContext items={projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {children}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
}
