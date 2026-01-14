import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { A3WizardData, WizardAttachment } from "@/hooks/useA3WizardState";
import { Upload, FileText, FileSpreadsheet, File, X, ZoomIn, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Document, Page, pdfjs } from 'react-pdf';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

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
  const isPdf = file.type.includes('pdf');

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

  if (isPdf) {
    return (
      <div 
        className="w-12 h-12 rounded bg-muted/50 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-primary transition-all relative group"
        onClick={onClick}
      >
        <FileText className="w-6 h-6 text-red-500" />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded transition-opacity flex items-center justify-center">
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

type PreviewState = 
  | { type: 'image'; url: string; name: string }
  | { type: 'pdf'; file: File; name: string };

export function Step3Diagnosis({ data, updateData }: Step3DiagnosisProps) {
  // Use centralized state from wizard
  const attachments = data.currentSituationAttachments;
  
  const [previewFile, setPreviewFile] = useState<PreviewState | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pdfError, setPdfError] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newAttachments: WizardAttachment[] = files.map(file => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
      type: file.type
    }));
    updateData({ 
      currentSituationAttachments: [...attachments, ...newAttachments] 
    });
  };

  const removeAttachment = (id: string) => {
    updateData({ 
      currentSituationAttachments: attachments.filter(a => a.id !== id) 
    });
  };

  const openPreview = (attachment: WizardAttachment) => {
    const isImage = attachment.type.startsWith('image/');
    const isPdf = attachment.type.includes('pdf');
    
    if (isPdf) {
      setPreviewFile({ type: 'pdf', file: attachment.file, name: attachment.name });
      setCurrentPage(1);
      setNumPages(0);
      setPdfError(false);
      return;
    }
    
    if (isImage) {
      const url = URL.createObjectURL(attachment.file);
      setPreviewFile({ type: 'image', url, name: attachment.name });
    }
  };

  const closePreview = () => {
    if (previewFile?.type === 'image') {
      URL.revokeObjectURL(previewFile.url);
    }
    setPreviewFile(null);
    setNumPages(0);
    setCurrentPage(1);
    setPdfError(false);
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPdfError(false);
  };

  const onDocumentLoadError = () => {
    setPdfError(true);
  };

  const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, numPages));

  const downloadPdf = () => {
    if (previewFile?.type === 'pdf') {
      const url = URL.createObjectURL(previewFile.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = previewFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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
            Situação Atual
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
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center gap-3 bg-muted/50 rounded-lg p-2">
                    <LocalFileThumbnail file={attachment.file} onClick={() => openPreview(attachment)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{attachment.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => removeAttachment(attachment.id)}
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
          É uma fotografia do momento presente em que o item analisado se encontra em desacordo com os requisitos do negócio. O ideal neste caso é relacionar cada item que estiver NOK a uma situação atual, ou seja, um item Não OK causa um problema que deverá ser analisado e solucionado. Procure quantificar o que está sendo descrito, por exemplo, ao invés de simplesmente dizer o consumo de água está alto, coloque qual é o consumo atual.
        </p>
      </div>

      <Dialog open={!!previewFile} onOpenChange={closePreview}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center">
            {previewFile?.type === 'image' && (
              <img 
                src={previewFile.url} 
                alt={previewFile.name}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            )}
            
            {previewFile?.type === 'pdf' && !pdfError && (
              <>
                <div className="overflow-auto max-h-[60vh] border rounded-lg bg-muted/30">
                  <Document
                    file={previewFile.file}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={
                      <div className="flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                      </div>
                    }
                  >
                    <Page 
                      pageNumber={currentPage} 
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      className="mx-auto"
                    />
                  </Document>
                </div>
                
                {numPages > 0 && (
                  <div className="flex items-center gap-4 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPrevPage}
                      disabled={currentPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Página {currentPage} de {numPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextPage}
                      disabled={currentPage >= numPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={downloadPdf}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Baixar
                    </Button>
                  </div>
                )}
              </>
            )}

            {previewFile?.type === 'pdf' && pdfError && (
              <div className="flex flex-col items-center justify-center p-8 gap-4">
                <FileText className="h-16 w-16 text-muted-foreground" />
                <p className="text-muted-foreground text-center">
                  Não foi possível visualizar o PDF.<br />
                  Você pode baixá-lo para abrir em outro programa.
                </p>
                <Button onClick={downloadPdf}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
