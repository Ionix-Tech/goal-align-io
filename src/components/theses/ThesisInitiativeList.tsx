import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Lightbulb, Briefcase, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ThesisProject } from "@/hooks/useThesisProjects";

interface ThesisInitiativeListProps {
  initiatives: ThesisProject[];
  type: 'idea' | 'project';
  emptyMessage?: string;
  canManage?: boolean;
  onLinkClick?: () => void;
  onUnlink?: (projectId: string) => void;
}

const typeConfig = {
  idea: {
    icon: Lightbulb,
    label: 'Ideia',
    color: 'text-yellow-500',
  },
  project: {
    icon: Briefcase,
    label: 'Projeto',
    color: 'text-blue-500',
  },
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  idea: { label: 'Ideia', variant: 'secondary' },
  draft: { label: 'Rascunho', variant: 'outline' },
  review: { label: 'Em Revisão', variant: 'default' },
  approved: { label: 'Aprovado', variant: 'default' },
  archived: { label: 'Arquivado', variant: 'secondary' },
  completed: { label: 'Concluído', variant: 'default' },
};

export function ThesisInitiativeList({ 
  initiatives, 
  type, 
  emptyMessage,
  canManage = false,
  onLinkClick,
  onUnlink,
}: ThesisInitiativeListProps) {
  const navigate = useNavigate();
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className="space-y-3">
      {/* Header with link button */}
      {canManage && onLinkClick && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onLinkClick} className="gap-2">
            <Plus className="h-4 w-4" />
            Vincular {config.label.slice(0, -1)}
          </Button>
        </div>
      )}

      {initiatives.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <Icon className={`h-8 w-8 mx-auto mb-2 ${config.color} opacity-50`} />
          <p className="text-muted-foreground text-sm">
            {emptyMessage || `Nenhum(a) ${config.label.toLowerCase()} vinculado(a)`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {initiatives.map((initiative) => {
            const statusConfig = statusLabels[initiative.status] || statusLabels.draft;
            
            return (
              <Card 
                key={initiative.id}
                className="hover:shadow-sm transition-shadow cursor-pointer group"
                onClick={() => {
                  // Draft projects go directly to A3 wizard
                  if (initiative.initiative_type === 'project' && initiative.status === 'draft') {
                    navigate(`/projects/${initiative.id}/a3`);
                  } else {
                    navigate(`/projects/${initiative.id}`);
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Icon className={`h-5 w-5 flex-shrink-0 ${config.color}`} />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{initiative.name}</p>
                        {initiative.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {initiative.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge variant={statusConfig.variant}>
                        {statusConfig.label}
                      </Badge>
                      
                      {initiative.assigned_to_profile && (
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={initiative.assigned_to_profile.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {initiative.assigned_to_profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      {canManage && onUnlink && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUnlink(initiative.id);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
