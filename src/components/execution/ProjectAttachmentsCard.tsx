import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Paperclip, Upload, Download, Trash2, FileText, Image, FileSpreadsheet, File } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useProjectAttachments, useUploadProjectAttachment, useDeleteProjectAttachment, useDownloadProjectAttachment, ProjectAttachment } from "@/hooks/useProjectAttachments";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ProjectAttachmentsCardProps {
  projectId: string;
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
  if (fileType.includes('pdf')) return <FileText className="h-4 w-4" />;
  if (fileType.includes('sheet') || fileType.includes('excel')) return <FileSpreadsheet className="h-4 w-4" />;
  return <File className="h-4 w-4" />;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

function AttachmentThumbnail({ attachment }: { attachment: ProjectAttachment }) {
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
    <div className="w-12 h-12 rounded bg-muted/50 flex items-center justify-center flex-shrink-0">
      {getFileIcon(attachment.file_type)}
    </div>
  );
}

export function ProjectAttachmentsCard({ projectId }: ProjectAttachmentsCardProps) {
  const { user } = useAuth();
  const { data: attachments, isLoading } = useProjectAttachments(projectId);
  const uploadMutation = useUploadProjectAttachment();
  const deleteMutation = useDeleteProjectAttachment();
  const downloadMutation = useDownloadProjectAttachment();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    const maxSize = 20 * 1024 * 1024; // 20MB
    const validFiles = Array.from(files).filter(file => {
      if (file.size > maxSize) {
        toast.error(`${file.name} é muito grande (máx 20MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of validFiles) {
        await uploadMutation.mutateAsync({ projectId, file, userId: user.id });
      }
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleDelete = (attachmentId: string, filePath: string) => {
    if (confirm('Tem certeza que deseja remover este arquivo?')) {
      deleteMutation.mutate({ attachmentId, filePath, projectId });
    }
  };

  const handleDownload = (filePath: string) => {
    downloadMutation.mutate({ filePath });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Anexos do Projeto
          </CardTitle>
          <label htmlFor="project-file-upload">
            <Button size="sm" disabled={isUploading} asChild>
              <span className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Enviando...' : 'Upload'}
              </span>
            </Button>
            <Input
              id="project-file-upload"
              type="file"
              multiple
              accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando anexos...</p>
        ) : !attachments || attachments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum anexo adicionado ainda.</p>
        ) : (
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <AttachmentThumbnail attachment={attachment} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.file_size)} • {new Date(attachment.uploaded_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownload(attachment.file_path)}
                    disabled={downloadMutation.isPending}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(attachment.id, attachment.file_path)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
