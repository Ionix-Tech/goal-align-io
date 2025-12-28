import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { A3WizardData } from "@/hooks/useA3WizardState";
import { ProjectRequirement } from "@/hooks/useRequirements";
import { Upload, FileImage, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface Step4StrategyProps {
  data: A3WizardData;
  updateData: (updates: Partial<A3WizardData>) => void;
  updateRequirement: (index: number, updates: Partial<ProjectRequirement>) => void;
}

export function Step4Strategy({ data, updateData, updateRequirement }: Step4StrategyProps) {
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const gapAnalysis = useMemo(() => {
    return data.requirements.map(req => {
      if (req.current_value === null || req.target_value === null) {
        return { gap: null, effort: null, direction: null };
      }
      
      const gap = req.target_value - req.current_value;
      const percentChange = req.current_value !== 0 
        ? Math.abs(gap / req.current_value) * 100 
        : 100;
      
      let effort: 'low' | 'medium' | 'high';
      if (percentChange <= 10) effort = 'low';
      else if (percentChange <= 30) effort = 'medium';
      else effort = 'high';
      
      const direction = gap > 0 ? 'up' : gap < 0 ? 'down' : 'same';
      
      return { gap, effort, direction, percentChange };
    });
  }, [data.requirements]);

  const allTargetsSet = data.requirements.every(r => r.target_value !== null);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-accent text-accent-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
              4
            </span>
            Estratégia
          </CardTitle>
          <CardDescription>
            Onde queremos chegar? Defina as metas para cada requisito.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="target-situation">Descrição da Situação Alvo *</Label>
            <Textarea
              id="target-situation"
              value={data.targetSituationDescription}
              onChange={(e) => updateData({ targetSituationDescription: e.target.value })}
              placeholder="Descreva como será a situação ideal após o projeto, os benefícios esperados..."
              rows={4}
            />
          </div>

          <div className="space-y-3">
            <Label>Anexos de Referências (opcional)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
              <input
                type="file"
                id="target-file-upload"
                className="hidden"
                accept="image/*,.pdf,.xlsx,.xls"
                multiple
                onChange={handleFileChange}
              />
              <label htmlFor="target-file-upload" className="cursor-pointer">
                <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Projeções, benchmarks, referências...
                </p>
              </label>
            </div>
            
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                    <FileImage className="w-4 h-4" />
                    <span className="text-sm">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => removeAttachment(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Label>Tabela Comparativa: ATUAL × META</Label>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left px-4 py-2 text-sm font-medium">Requisito</th>
                    <th className="text-center px-4 py-2 text-sm font-medium w-24">Atual</th>
                    <th className="text-center px-4 py-2 text-sm font-medium w-24">Meta</th>
                    <th className="text-center px-4 py-2 text-sm font-medium w-32">Gap</th>
                    <th className="text-center px-4 py-2 text-sm font-medium w-24">Esforço</th>
                  </tr>
                </thead>
                <tbody>
                  {data.requirements.map((req, index) => {
                    const analysis = gapAnalysis[index];
                    return (
                      <tr key={index} className="border-t">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs font-bold">
                              {req.code}
                            </span>
                            <span className="text-sm">{req.indicator_name}</span>
                          </div>
                        </td>
                        <td className="text-center px-4 py-3">
                          <span className="text-sm">
                            {req.current_value ?? "-"} {req.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            value={req.target_value ?? ""}
                            onChange={(e) => updateRequirement(index, { 
                              target_value: e.target.value ? parseFloat(e.target.value) : null 
                            })}
                            className="w-full text-center"
                            placeholder="Meta"
                          />
                        </td>
                        <td className="text-center px-4 py-3">
                          {analysis.gap !== null ? (
                            <div className="flex items-center justify-center gap-1">
                              {analysis.direction === 'up' && <TrendingUp className="w-4 h-4 text-success" />}
                              {analysis.direction === 'down' && <TrendingDown className="w-4 h-4 text-warning" />}
                              {analysis.direction === 'same' && <Minus className="w-4 h-4 text-muted-foreground" />}
                              <span className="text-sm">
                                {analysis.gap > 0 ? '+' : ''}{analysis.gap.toFixed(1)} {req.unit}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="text-center px-4 py-3">
                          {analysis.effort && (
                            <span
                              className={cn(
                                "px-2 py-1 rounded text-xs font-medium",
                                analysis.effort === 'low' && "bg-success/20 text-success",
                                analysis.effort === 'medium' && "bg-warning/20 text-warning",
                                analysis.effort === 'high' && "bg-destructive/20 text-destructive"
                              )}
                            >
                              {analysis.effort === 'low' && '🟢 Baixo'}
                              {analysis.effort === 'medium' && '🟡 Médio'}
                              {analysis.effort === 'high' && '🔴 Alto'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <h4 className="font-medium text-sm text-muted-foreground mb-2">
          💡 Dica
        </h4>
        <p className="text-sm text-muted-foreground">
          O cálculo de esforço é baseado na variação percentual entre atual e meta. Use isso para priorizar ações e alocar recursos de forma adequada.
        </p>
      </div>
    </div>
  );
}
