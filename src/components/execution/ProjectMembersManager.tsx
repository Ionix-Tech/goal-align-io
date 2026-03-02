import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ProjectMembersManagerProps {
  projectId: string;
  assigneeId?: string | null;
}

function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: ["project-members-manager", projectId],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("project_members")
        .select("id, user_id")
        .eq("project_id", projectId);

      if (error) throw error;
      if (!rows || rows.length === 0) return [];

      const userIds = rows.map(r => r.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name]));

      return rows
        .filter(r => profileMap.has(r.user_id))
        .map(r => ({
          rowId: r.id,
          userId: r.user_id,
          fullName: profileMap.get(r.user_id)!,
        }));
    },
  });
}

export function ProjectMembersManager({ projectId, assigneeId }: ProjectMembersManagerProps) {
  const { data: allMembers = [] } = useTeamMembers();
  const { data: projectMembers = [] } = useProjectMembers(projectId);
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const memberUserIds = projectMembers.map(m => m.userId);
  const availableMembers = allMembers.filter(
    m => m.id !== assigneeId && !memberUserIds.includes(m.id)
  );

  const handleAddMember = async () => {
    if (!selectedUserId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("project_members")
      .insert({ project_id: projectId, user_id: selectedUserId, added_by: user.id });

    if (error) {
      if (error.code === "23505") {
        toast.error("Este membro já faz parte do projeto");
      } else {
        console.error("Erro ao adicionar membro:", error.message, error.code);
        toast.error(`Erro ao adicionar membro: ${error.message}`);
      }
    } else {
      await queryClient.refetchQueries({ queryKey: ["project-members-manager", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-details", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-team-members", projectId] });
      setSelectedUserId("");
      setDialogOpen(false);
      toast.success("Membro adicionado");
    }
  };

  const handleRemoveMember = async (rowId: string) => {
    const { error } = await supabase
      .from("project_members")
      .delete()
      .eq("id", rowId);

    if (error) {
      toast.error("Erro ao remover membro");
    } else {
      await queryClient.refetchQueries({ queryKey: ["project-members-manager", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-details", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-team-members", projectId] });
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">👥 Equipe:</span>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="rounded-full w-5 h-5 flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          title="Adicionar membro"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      {projectMembers.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {projectMembers.map((m) => (
            <Badge
              key={m.rowId}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              {m.fullName}
              <button
                type="button"
                onClick={() => handleRemoveMember(m.rowId)}
                className="ml-1 rounded-full hover:bg-muted p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic mt-1">Nenhum membro adicionado</p>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Adicionar Membro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um membro..." />
              </SelectTrigger>
              <SelectContent>
                {availableMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddMember} disabled={!selectedUserId}>
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
