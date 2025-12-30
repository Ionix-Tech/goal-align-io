import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { A3WizardData } from "@/hooks/useA3WizardState";
import { Upload, FileText, FileSpreadsheet, File, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function getFileIcon(fileType: string) {
  if (fileType.includes('pdf')) return <FileText className="w-6 h-6 text-red-500" />;
  if (fileType.includes('sheet') || fileType.includes('excel') || fileType.includes('xls')) {
    return <FileSpreadsheet className="w-6 h-6 text-green-500" />;
  }
  return <File className="w-6 h-6 text-muted-foreground" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function LocalFileThumbnail({ file, onClick }: { file: File; onClick: () => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const isImage = file.type.startsWith('image/');

  useEffect(() => {
    if (!isImage) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file, isImage]);

  if (isImage && preview) {
    return (
      <div 
        className="w-12 h-12 rounded overflow-hidden bg-muted cursor-pointer hover:ring-2 hover:ring-primary transition-all relative group"
        onClick={onClick}
      >
        <img src={preview} alt={file.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <ZoomIn className="w-4 h-4 text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-12 h-12 rounded bg-muted/50 flex items-center justify-center">
      {getFileIcon(file.type)}
    </div>
  );
}

interface Step3DiagnosisProps {
  data: A3WizardData;
  updateData: (updates: Partial<A3WizardData>) => void;
}

export function Step3Diagnosis({ data, updateData }: Step3DiagnosisProps) {
  const [attachments, setAttachments] = useState<File[]>([]);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const openPreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewImage({ url, name: file.name });
    }
  };

  const closePreview = () => {
    if (previewImage) {
      URL.revokeObjectURL(previewImage.url);
      setPreviewImage(null);
    }
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center gap-3 bg-muted/50 rounded-lg p-2">
                    <LocalFileThumbnail file={file} onClick={() => openPreview(file)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="h-4 w-4" />
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

      <Dialog open={!!previewImage} onOpenChange={closePreview}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewImage?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center">
            <img 
              src={previewImage?.url} 
              alt={previewImage?.name}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
