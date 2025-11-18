import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProjectAttachment {
  id: string;
  project_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  uploaded_at: string;
}

export function useProjectAttachments(projectId: string) {
  return useQuery({
    queryKey: ['project-attachments', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_attachments')
        .select('*')
        .eq('project_id', projectId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as ProjectAttachment[];
    },
    enabled: !!projectId
  });
}

export function useUploadProjectAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      file,
      userId
    }: {
      projectId: string;
      file: File;
      userId: string;
    }) => {
      // Upload para storage
      const fileExt = file.name.split('.').pop();
      const fileName = `projects/${projectId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('project-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Criar registro no banco
      const { data, error } = await supabase
        .from('project_attachments')
        .insert({
          project_id: projectId,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          file_type: file.type,
          uploaded_by: userId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project-attachments', variables.projectId] });
      toast.success('Arquivo enviado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao enviar arquivo: ' + error.message);
    }
  });
}

export function useDeleteProjectAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      attachmentId,
      filePath,
      projectId
    }: {
      attachmentId: string;
      filePath: string;
      projectId: string;
    }) => {
      // Deletar do storage
      const { error: storageError } = await supabase.storage
        .from('project-attachments')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Deletar registro do banco
      const { error } = await supabase
        .from('project_attachments')
        .delete()
        .eq('id', attachmentId);

      if (error) throw error;
      return { projectId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['project-attachments', result.projectId] });
      toast.success('Arquivo removido com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover arquivo: ' + error.message);
    }
  });
}

export function useDownloadProjectAttachment() {
  return useMutation({
    mutationFn: async ({ filePath }: { filePath: string }) => {
      const { data, error } = await supabase.storage
        .from('project-attachments')
        .createSignedUrl(filePath, 60); // 60 segundos

      if (error) throw error;
      return data.signedUrl;
    },
    onSuccess: (signedUrl) => {
      window.open(signedUrl, '_blank');
    },
    onError: (error: any) => {
      toast.error('Erro ao baixar arquivo: ' + error.message);
    }
  });
}
