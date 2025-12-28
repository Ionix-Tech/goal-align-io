import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { A3WizardData } from "@/hooks/useA3WizardState";
import { ProjectRequirement } from "@/hooks/useRequirements";
import { Upload, FileImage, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Step3DiagnosisProps {
  data: A3WizardData;
  updateData: (updates: Partial<A3WizardData>) => void;
  updateRequirement: (index: number, updates: Partial<ProjectRequirement>) => void;
}

export function Step3Diagnosis({ data, updateData, updateRequirement }: Step3DiagnosisProps) {
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const allCurrentValuesSet = data.requirements.every(r => r.current_value !== null);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="bg-accent text-accent-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
              3
            </span>
            Diagnóstico
          </CardTitle>
          <CardDescription>
            Onde estamos hoje? Descreva a situação atual e preencha os valores de cada requisito.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="current-situation">Descrição da Situação Atual *</Label>
            <Textarea
              id="current-situation"
              value={data.currentSituationDescription}
              onChange={(e) => updateData({ currentSituationDescription: e.target.value })}
              placeholder="Descreva detalhadamente a situação atual, os problemas identificados, o histórico..."
              rows={4}
            />
          </div>

          <div className="space-y-3">
            <Label>Anexos de Evidências</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept="image/*,.pdf,.xlsx,.xls"
                multiple
                onChange={handleFileChange}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Clique ou arraste arquivos aqui
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Prints, gráficos, fotos, PDFs (mínimo 1 anexo recomendado)
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
            <Label>Valores ATUAIS dos Requisitos</Label>
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="grid gap-3">
                {data.requirements.map((req, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 bg-background rounded-lg p-3 border"
                  >
                    <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs font-bold">
                      {req.code}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{req.indicator_name || "Indicador não definido"}</p>
                      <p className="text-xs text-muted-foreground">{req.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={req.current_value ?? ""}
                        onChange={(e) => updateRequirement(index, { 
                          current_value: e.target.value ? parseFloat(e.target.value) : null 
                        })}
                        className="w-24 text-right"
                        placeholder="Valor"
                      />
                      <span className="text-sm text-muted-foreground w-12">
                        {req.unit || "-"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {!allCurrentValuesSet && (
              <div className="flex items-center gap-2 text-warning text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Preencha o valor atual de todos os requisitos para continuar.</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <h4 className="font-medium text-sm text-muted-foreground mb-2">
          💡 Dica
        </h4>
        <p className="text-sm text-muted-foreground">
          Anexe evidências visuais (gráficos, fotos do processo, prints de sistemas) para documentar a situação atual. Isso será fundamental durante as apresentações e para referência futura.
        </p>
      </div>
    </div>
  );
}
