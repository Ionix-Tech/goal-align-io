import { useParams, useNavigate } from "react-router-dom";
import { useA3ReviewData } from "@/hooks/useA3ReviewData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  FileText, 
  Target, 
  Search, 
  Rocket, 
  Calendar, 
  BarChart3,
  CheckCircle,
  Clock,
  User,
  Building
} from "lucide-react";
import { A3ContextSection } from "./sections/A3ContextSection";
import { A3RequirementsSection } from "./sections/A3RequirementsSection";
import { A3DiagnosisSection } from "./sections/A3DiagnosisSection";
import { A3StrategySection } from "./sections/A3StrategySection";
import { A3ExecutionSection } from "./sections/A3ExecutionSection";
import { A3ControlSection } from "./sections/A3ControlSection";
import { A3ReviewActions } from "./A3ReviewActions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  review: { label: "Em Aprovação", variant: "default" },
  approved: { label: "Aprovado", variant: "outline" },
  archived: { label: "Arquivado", variant: "destructive" },
  completed: { label: "Concluído", variant: "outline" }
};

export function A3ReviewView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, error } = useA3ReviewData(id || null);

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container max-w-6xl py-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Projeto não encontrado.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const statusInfo = statusLabels[data.status] || { label: data.status, variant: "secondary" as const };

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2 -ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{data.name}</h1>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {data.assigneeName && (
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {data.assigneeName}
              </span>
            )}
            {data.category && (
              <span className="flex items-center gap-1">
                <Building className="w-4 h-4" />
                {data.category}
              </span>
            )}
            {data.submitted_for_review_at && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Enviado em {format(new Date(data.submitted_for_review_at), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            )}
            {data.approved_at && (
              <span className="flex items-center gap-1 text-success">
                <CheckCircle className="w-4 h-4" />
                Aprovado em {format(new Date(data.approved_at), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="context" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 h-auto">
          <TabsTrigger value="context" className="flex items-center gap-2 py-3">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Contexto</span>
          </TabsTrigger>
          <TabsTrigger value="requirements" className="flex items-center gap-2 py-3">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Requisitos</span>
          </TabsTrigger>
          <TabsTrigger value="diagnosis" className="flex items-center gap-2 py-3">
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Diagnóstico</span>
          </TabsTrigger>
          <TabsTrigger value="strategy" className="flex items-center gap-2 py-3">
            <Rocket className="w-4 h-4" />
            <span className="hidden sm:inline">Estratégia</span>
          </TabsTrigger>
          <TabsTrigger value="execution" className="flex items-center gap-2 py-3">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Execução</span>
          </TabsTrigger>
          <TabsTrigger value="control" className="flex items-center gap-2 py-3">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Controle</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="context">
          <A3ContextSection data={data} />
        </TabsContent>

        <TabsContent value="requirements">
          <A3RequirementsSection requirements={data.requirements} />
        </TabsContent>

        <TabsContent value="diagnosis">
          <A3DiagnosisSection 
            description={data.currentSituationDescription}
            attachments={data.attachments}
          />
        </TabsContent>

        <TabsContent value="strategy">
          <A3StrategySection 
            description={data.targetSituationDescription}
            requirements={data.requirements}
          />
        </TabsContent>

          <TabsContent value="execution">
            <A3ExecutionSection 
              milestones={data.milestones}
              whyLinks={data.whyLinks}
              tasks={data.tasks}
            />
        </TabsContent>

        <TabsContent value="control">
          <A3ControlSection 
            indicators={data.indicators}
            requirements={data.requirements}
          />
        </TabsContent>
      </Tabs>

      {/* Actions (Approve/Reject) */}
      {data.status === 'review' && (
        <A3ReviewActions projectId={data.id} projectName={data.name} />
      )}
    </div>
  );
}
