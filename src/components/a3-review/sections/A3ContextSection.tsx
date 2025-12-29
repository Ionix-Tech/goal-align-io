import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { A3ReviewData } from "@/hooks/useA3ReviewData";
import { FileText, Target, Building, User, Bookmark } from "lucide-react";
import { PROJECT_CATEGORIES } from "@/config/categories";

interface A3ContextSectionProps {
  data: A3ReviewData;
}

export function A3ContextSection({ data }: A3ContextSectionProps) {
  const categoryLabel = PROJECT_CATEGORIES.find(c => c.value === data.category)?.label || data.category || "Não definida";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Contexto do Projeto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Project Name */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Nome do Projeto</label>
            <p className="text-lg font-semibold">{data.name}</p>
          </div>

          {/* Objective */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4" />
              Objetivo Estratégico
            </label>
            <p className="text-foreground bg-muted/30 p-3 rounded-lg">
              {data.objective || <span className="text-muted-foreground italic">Não informado</span>}
            </p>
          </div>

          {/* Grid with details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strategic Thesis */}
            <div className="space-y-1 border rounded-lg p-4">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Bookmark className="w-4 h-4" />
                Tese Estratégica (OKR)
              </label>
              <p className="font-medium">
                {data.thesisName || <span className="text-muted-foreground italic">Não vinculada</span>}
              </p>
            </div>

            {/* Strategic Indicator */}
            <div className="space-y-1 border rounded-lg p-4">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="w-4 h-4" />
                Indicador Macro Impactado
              </label>
              <p className="font-medium">
                {data.strategicIndicator || <span className="text-muted-foreground italic">Não informado</span>}
              </p>
            </div>

            {/* Category */}
            <div className="space-y-1 border rounded-lg p-4">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building className="w-4 h-4" />
                Área Responsável
              </label>
              <p className="font-medium">{categoryLabel}</p>
            </div>

            {/* Leader */}
            <div className="space-y-1 border rounded-lg p-4">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                Líder do Projeto
              </label>
              <p className="font-medium">
                {data.assigneeName || <span className="text-muted-foreground italic">Não atribuído</span>}
              </p>
            </div>
          </div>

          {/* Creator info */}
          {data.createdByName && (
            <div className="text-sm text-muted-foreground pt-4 border-t">
              Criado por: <span className="font-medium">{data.createdByName}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
