import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CategoryImage {
  id: string;
  name: string;
  filePath: string;
  url: string;
}

interface CategoryAttachments {
  currentImages: CategoryImage[];
  targetImages: CategoryImage[];
}

export function useProjectCategoryAttachments(projectId: string | null | undefined) {
  return useQuery<CategoryAttachments>({
    queryKey: ['project-category-attachments', projectId],
    queryFn: async () => {
      if (!projectId) return { currentImages: [], targetImages: [] };

      const { data, error } = await supabase
        .from('project_attachments')
        .select('id, file_name, file_path, file_type, category')
        .eq('project_id', projectId)
        .in('category', ['current_situation', 'target_situation'])
        .like('file_type', 'image/%');

      if (error) throw error;

      const attachments = data || [];

      // Generate signed URLs for all images in parallel
      const withUrls = await Promise.all(
        attachments.map(async (att) => {
          const { data: urlData } = await supabase.storage
            .from('project-attachments')
            .createSignedUrl(att.file_path, 3600);
          return {
            id: att.id,
            name: att.file_name,
            filePath: att.file_path,
            category: att.category,
            url: urlData?.signedUrl || '',
          };
        })
      );

      return {
        currentImages: withUrls.filter(a => a.category === 'current_situation' && a.url),
        targetImages: withUrls.filter(a => a.category === 'target_situation' && a.url),
      };
    },
    enabled: !!projectId,
  });
}
