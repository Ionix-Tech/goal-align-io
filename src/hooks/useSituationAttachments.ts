import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SituationAttachment {
  id: string;
  situation_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  uploaded_at: string;
}

export function useSituationAttachments(situationId: string) {
  return useQuery({
    queryKey: ['situation-attachments', situationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('situation_attachments')
        .select('*')
        .eq('situation_id', situationId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as SituationAttachment[];
    },
    enabled: !!situationId
  });
}

export function useUploadAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      situationId,
      file,
      userId
    }: {
      situationId: string;
      file: File;
      userId: string;
    }) => {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${situationId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('project-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create attachment record
      const { data, error } = await supabase
        .from('situation_attachments')
        .insert({
          situation_id: situationId,
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
      queryClient.invalidateQueries({ queryKey: ['situation-attachments', variables.situationId] });
      queryClient.invalidateQueries({ queryKey: ['project-situations'] });
      toast.success('Arquivo enviado com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao enviar arquivo: ' + error.message);
    }
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      attachmentId, 
      filePath, 
      situationId 
    }: { 
      attachmentId: string; 
      filePath: string;
      situationId: string;
    }) => {
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('project-attachments')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete attachment record
      const { error } = await supabase
        .from('situation_attachments')
        .delete()
        .eq('id', attachmentId);

      if (error) throw error;
      return { situationId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['situation-attachments', data.situationId] });
      queryClient.invalidateQueries({ queryKey: ['project-situations'] });
      toast.success('Arquivo removido com sucesso');
    },
    onError: (error: any) => {
      toast.error('Erro ao remover arquivo: ' + error.message);
    }
  });
}

export function useDownloadAttachment() {
  return useMutation({
    mutationFn: async ({ filePath }: { filePath: string }) => {
      const { data, error } = await supabase.storage
        .from('project-attachments')
        .createSignedUrl(filePath, 60); // 60 seconds expiry

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
