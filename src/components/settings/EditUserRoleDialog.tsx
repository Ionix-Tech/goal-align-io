import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type AppRole = "ceo" | "pmo_manager" | "project_member";

const roleLabels: Record<AppRole, string> = {
  ceo: "CEO",
  pmo_manager: "PMO Manager",
  project_member: "Membro de Projeto",
};

interface EditUserRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    full_name: string;
    email: string;
    currentRole: AppRole;
  } | null;
}

export function EditUserRoleDialog({
  open,
  onOpenChange,
  user,
}: EditUserRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<AppRole | "">(
    user?.currentRole || ""
  );
  const queryClient = useQueryClient();

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error("Não autenticado");
      }

      const response = await supabase.functions.invoke("update-user-role", {
        body: { user_id: userId, new_role: newRole },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao atualizar role");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    },
    onSuccess: () => {
      toast.success("Função atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar função");
    },
  });

  const handleSubmit = () => {
    if (!user || !selectedRole) return;
    updateRoleMutation.mutate({ userId: user.id, newRole: selectedRole });
  };

  // Update selectedRole when user changes
  if (user && selectedRole === "" && user.currentRole) {
    setSelectedRole(user.currentRole);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Editar Função
          </DialogTitle>
          <DialogDescription>
            Altere a função de {user?.full_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Usuário</Label>
            <p className="text-sm text-muted-foreground">
              {user?.full_name} ({user?.email})
            </p>
          </div>

          <div className="space-y-2">
            <Label>Nova Função</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as AppRole)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ceo">{roleLabels.ceo}</SelectItem>
                <SelectItem value="pmo_manager">{roleLabels.pmo_manager}</SelectItem>
                <SelectItem value="project_member">{roleLabels.project_member}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              updateRoleMutation.isPending ||
              !selectedRole ||
              selectedRole === user?.currentRole
            }
          >
            {updateRoleMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
