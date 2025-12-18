import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lightbulb, Briefcase, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ThesisProject } from "@/hooks/useThesisProjects";

interface ThesisInitiativeListProps {
  initiatives: ThesisProject[];
  type: 'idea' | 'project' | 'action_plan';
  emptyMessage?: string;
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
  action_plan: {
    icon: ClipboardList,
    label: 'Plano de Ação',
    color: 'text-purple-500',
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

export function ThesisInitiativeList({ initiatives, type, emptyMessage }: ThesisInitiativeListProps) {
  const navigate = useNavigate();
  const config = typeConfig[type];
  const Icon = config.icon;

  if (initiatives.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed rounded-lg">
        <Icon className={`h-8 w-8 mx-auto mb-2 ${config.color} opacity-50`} />
        <p className="text-muted-foreground text-sm">
          {emptyMessage || `Nenhum(a) ${config.label.toLowerCase()} vinculado(a)`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {initiatives.map((initiative) => {
        const statusConfig = statusLabels[initiative.status] || statusLabels.draft;
        
        return (
          <Card 
            key={initiative.id}
            className="hover:shadow-sm transition-shadow cursor-pointer"
            onClick={() => navigate(`/projects/${initiative.id}`)}
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
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
