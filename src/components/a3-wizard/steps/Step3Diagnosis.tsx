import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { A3WizardData } from "@/hooks/useA3WizardState";
import { Upload, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Step3DiagnosisProps {
  data: A3WizardData;
  updateData: (updates: Partial<A3WizardData>) => void;
}

export function Step3Diagnosis({ data, updateData }: Step3DiagnosisProps) {
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
              3
            </span>
            Diagnóstico
          </CardTitle>
          <CardDescription>
            Onde estamos hoje? Descreva a situação atual com evidências.
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
