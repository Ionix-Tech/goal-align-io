import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { A3Attachment } from "@/hooks/useA3ReviewData";
import { Search, FileIcon, ExternalLink, Image, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface A3DiagnosisSectionProps {
  description: string | null;
  attachments: A3Attachment[];
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return <Image className="w-5 h-5" />;
  return <FileText className="w-5 h-5" />;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

function AttachmentThumbnail({ attachment }: { attachment: A3Attachment }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const isImage = attachment.file_type.startsWith('image/');

  useEffect(() => {
    if (!isImage) return;
    
    const fetchImageUrl = async () => {
      const { data } = await supabase.storage
        .from('project-attachments')
        .createSignedUrl(attachment.file_path, 3600);
      if (data?.signedUrl) {
        setImageUrl(data.signedUrl);
      }
    };
    
    fetchImageUrl();
  }, [attachment.file_path, isImage]);

  if (isImage && imageUrl) {
    return (
      <div className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
        <img 
          src={imageUrl} 
          alt={attachment.file_name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="w-12 h-12 rounded bg-muted/50 flex items-center justify-center flex-shrink-0 text-muted-foreground">
      {getFileIcon(attachment.file_type)}
    </div>
  );
}

export function A3DiagnosisSection({ description, attachments }: A3DiagnosisSectionProps) {
  const handleDownload = async (attachment: A3Attachment) => {
    const { data } = await supabase.storage
      .from('project-attachments')
      .createSignedUrl(attachment.file_path, 3600);
    
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Diagnóstico - Situação Atual
          </CardTitle>
          <CardDescription>
            Descrição do cenário atual e problemas identificados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Descrição da Situação Atual
            </label>
            <div className="bg-muted/30 p-4 rounded-lg min-h-[100px]">
              {description ? (
                <p className="text-foreground whitespace-pre-wrap">{description}</p>
              ) : (
                <p className="text-muted-foreground italic">Nenhuma descrição fornecida.</p>
              )}
            </div>
          </div>

          {/* Attachments */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileIcon className="w-4 h-4" />
              Anexos e Evidências
            </label>
            
            {attachments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {attachments.map((att) => (
                  <div 
                    key={att.id}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-background hover:bg-muted/30 transition-colors"
                  >
                    <AttachmentThumbnail attachment={att} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{att.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(att.file_size)}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDownload(att)}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm italic py-4 text-center border rounded-lg">
                Nenhum anexo adicionado.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
