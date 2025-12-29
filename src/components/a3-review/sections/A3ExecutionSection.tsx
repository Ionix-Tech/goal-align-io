import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { A3Milestone, A3WhyLink, A3Task } from "@/hooks/useA3ReviewData";
import { Calendar, ExternalLink, Link, PlaneTakeoff, Plane, PlaneLanding, ClipboardList, User, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface A3ExecutionSectionProps {
  milestones: A3Milestone[];
  whyLinks: A3WhyLink[];
  tasks: A3Task[];
}

const getMilestoneIcon = (type: string | null) => {
  switch (type) {
    case 'decolagem': return <PlaneTakeoff className="w-5 h-5" />;
    case 'voo': return <Plane className="w-5 h-5" />;
    case 'escala': return <PlaneLanding className="w-5 h-5" />;
    default: return <Calendar className="w-5 h-5" />;
  }
};

const getMilestoneColor = (type: string | null) => {
  switch (type) {
    case 'decolagem': return 'text-accent border-accent/30 bg-accent/5';
    case 'voo': return 'text-warning border-warning/30 bg-warning/5';
    case 'escala': return 'text-success border-success/30 bg-success/5';
    default: return 'text-muted-foreground border-border bg-muted/20';
  }
};

const getMilestoneLabel = (type: string | null) => {
  switch (type) {
    case 'decolagem': return 'M1 - Decolagem';
    case 'voo': return 'M2 - Voo';
    case 'escala': return 'M3 - Escala';
    default: return 'Milestone';
  }
};

export function A3ExecutionSection({ milestones, whyLinks, tasks }: A3ExecutionSectionProps) {
  return (
    <div className="space-y-4">
      {/* Tasks/Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Ações Planejadas
          </CardTitle>
          <CardDescription>
            Ações definidas para alcançar os objetivos do projeto
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length > 0 ? (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div 
                  key={task.id}
                  className="border rounded-lg p-4 bg-card space-y-2"
                >
                  <p className="font-medium">{task.title}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {task.assigneeName && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {task.assigneeName}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(task.dueDate), "dd/MM/yyyy")}
                      </span>
                    )}
                  </div>
                  {task.linkedRequirements.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {task.linkedRequirements.map(code => (
                        <Badge key={code} variant="secondary" className="text-xs">
                          {code}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma ação definida.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Milestones do Projeto
          </CardTitle>
          <CardDescription>
            Marcos de verificação ao longo dos 90 dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          {milestones.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {milestones.map((milestone) => (
                <div 
                  key={milestone.id}
                  className={`border rounded-lg p-4 space-y-3 ${getMilestoneColor(milestone.milestone_type)}`}
                >
                  <div className="flex items-center gap-2">
                    {getMilestoneIcon(milestone.milestone_type)}
                    <span className="font-semibold">
                      {getMilestoneLabel(milestone.milestone_type)}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{milestone.title}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm">
                      {format(new Date(milestone.target_date), "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                    {milestone.completed && (
                      <Badge variant="outline" className="text-success border-success">
                        Concluído
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Nenhum milestone definido.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Why Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="w-5 h-5 text-primary" />
            Links de Referência
          </CardTitle>
        </CardHeader>
        <CardContent>
          {whyLinks.length > 0 ? (
            <div className="space-y-2">
              {whyLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 border rounded-lg bg-background hover:bg-muted/30 transition-colors group"
                >
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate group-hover:text-primary">
                      {link.label || link.url}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Nenhum link de referência adicionado.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
