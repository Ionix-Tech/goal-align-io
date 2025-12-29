import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { A3WizardData } from "@/hooks/useA3WizardState";
import { Upload, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Step4StrategyProps {
  data: A3WizardData;
  updateData: (updates: Partial<A3WizardData>) => void;
}

export function Step4Strategy({ data, updateData }: Step4StrategyProps) {
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

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
            Onde queremos chegar? Descreva a situação desejada ao final do projeto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="target-situation">Descrição da Situação Alvo *</Label>
            <Textarea
              id="target-situation"
              value={data.targetSituationDescription}
              onChange={(e) => updateData({ targetSituationDescription: e.target.value })}
              placeholder="Descreva como será a situação ideal após o projeto, os benefícios esperados, resultados tangíveis..."
              rows={6}
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

          {/* Resumo dos Requisitos */}
          <div className="space-y-3">
            <Label>Requisitos a serem atendidos</Label>
            <div className="bg-muted/30 rounded-lg p-4">
              {data.requirements.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Nenhum requisito definido ainda.
                </p>
              ) : (
                <div className="space-y-2">
                  {data.requirements.map((req, index) => (
                    <div 
                      key={index}
                      className="flex items-start gap-3 p-2 bg-background rounded-lg border"
                    >
                      <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs font-bold shrink-0">
                        {req.code}
                      </span>
                      <p className="text-sm">{req.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Os indicadores e metas serão definidos na etapa de Controle.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <h4 className="font-medium text-sm text-muted-foreground mb-2">
          💡 Dica
        </h4>
        <p className="text-sm text-muted-foreground">
          Seja específico sobre os resultados esperados. Uma boa descrição da situação alvo facilita o alinhamento da equipe e a medição do sucesso do projeto.
        </p>
      </div>
    </div>
  );
}
