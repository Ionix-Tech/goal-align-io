import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Clock, ListTodo } from "lucide-react";
import type { WorkloadMember } from "@/hooks/useWorkloadData";
import { getTaskWorkloadConfig } from "@/config/workloadRules";

interface WorkloadMemberCardProps {
  member: WorkloadMember;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function WorkloadMemberCard({ member }: WorkloadMemberCardProps) {
  const config = getTaskWorkloadConfig(member.workloadLevel);
  const progressPercentage =
    member.totalTasks > 0
      ? Math.round((member.completed / member.totalTasks) * 100)
      : 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getInitials(member.memberName)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h4 className="font-medium truncate">{member.memberName}</h4>
              <Badge variant={config.badge} className="shrink-0">
                {config.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate mb-3">
              {member.email}
            </p>

            <div className="grid grid-cols-4 gap-2 text-xs mb-3">
              <div className="flex items-center gap-1">
                <ListTodo className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">A fazer:</span>
                <span className="font-medium">{member.notStarted}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-blue-500" />
                <span className="text-muted-foreground">Em prog:</span>
                <span className="font-medium">{member.inProgress}</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span className="text-muted-foreground">Feitas:</span>
                <span className="font-medium">{member.completed}</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-red-500" />
                <span className="text-muted-foreground">Atrasadas:</span>
                <span className="font-medium text-red-600">{member.overdue}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Progresso geral</span>
                <span className="font-medium">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
