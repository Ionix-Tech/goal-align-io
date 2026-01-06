import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, AlertCircle, HelpCircle, FolderKanban } from "lucide-react";
import type { ProjectLeader } from "@/hooks/useProjectLeadershipData";
import { getLeadershipConfig } from "@/config/workloadRules";

interface ProjectLeaderCardProps {
  leader: ProjectLeader;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ProjectLeaderCard({ leader }: ProjectLeaderCardProps) {
  const config = getLeadershipConfig(leader.leadershipLevel);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getInitials(leader.leaderName)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h4 className="font-medium truncate">{leader.leaderName}</h4>
              <Badge variant={config.badge} className="shrink-0">
                {config.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate mb-3">
              {leader.email}
            </p>

            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
              <FolderKanban className="h-3 w-3" />
              <span>{leader.totalProjects} projetos</span>
              {leader.overdueProjects > 0 && (
                <span className="text-red-600 ml-2">
                  • {leader.overdueProjects} com atrasos
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2 text-xs mb-3">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span className="text-muted-foreground">Saudável:</span>
                <span className="font-medium">{leader.healthy}</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-yellow-500" />
                <span className="text-muted-foreground">Atenção:</span>
                <span className="font-medium">{leader.attention}</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-red-500" />
                <span className="text-muted-foreground">Crítico:</span>
                <span className="font-medium text-red-600">{leader.critical}</span>
              </div>
              <div className="flex items-center gap-1">
                <HelpCircle className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">S/ status:</span>
                <span className="font-medium">{leader.noStatus}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Progresso médio</span>
                <span className="font-medium">{leader.averageProgress}%</span>
              </div>
              <Progress value={leader.averageProgress} className="h-2" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
