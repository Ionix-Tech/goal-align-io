import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { A3Requirement } from "@/hooks/useA3ReviewData";
import { Target, CheckCircle } from "lucide-react";

interface A3RequirementsSectionProps {
  requirements: A3Requirement[];
}

export function A3RequirementsSection({ requirements }: A3RequirementsSectionProps) {
  if (requirements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Requisitos do Projeto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Nenhum requisito foi definido para este projeto.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Requisitos do Projeto
        </CardTitle>
        <CardDescription>
          Critérios de sucesso que devem ser atendidos ao final do projeto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {requirements.map((req, index) => (
            <div 
              key={req.id}
              className="flex items-start gap-3 p-4 border rounded-lg bg-muted/20"
            >
              <Badge variant="secondary" className="shrink-0 font-mono">
                {req.code}
              </Badge>
              <div className="flex-1">
                <p className="text-foreground">{req.description}</p>
              </div>
              <CheckCircle className="w-5 h-5 text-muted-foreground/50 shrink-0" />
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Total: <span className="font-medium">{requirements.length}</span> requisito{requirements.length !== 1 ? 's' : ''} definido{requirements.length !== 1 ? 's' : ''}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
