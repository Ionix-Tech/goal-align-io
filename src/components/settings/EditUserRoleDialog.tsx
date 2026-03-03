import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Shield, Eye, EyeOff, KeyRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

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
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error("Não autenticado");
      }

      const response = await supabase.functions.invoke("reset-user-password", {
        body: { user_id: userId, new_password: password },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao resetar senha");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    },
    onSuccess: () => {
      toast.success("Senha resetada com sucesso!");
      setNewPassword("");
      setShowPassword(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao resetar senha");
    },
  });

  const handleResetPassword = () => {
    if (!user || !newPassword) return;
    resetPasswordMutation.mutate({ userId: user.id, password: newPassword });
  };

  const handleSubmit = () => {
    if (!user || !selectedRole) return;
    updateRoleMutation.mutate({ userId: user.id, newRole: selectedRole });
  };

  // Update selectedRole when user changes
  if (user && selectedRole === "" && user.currentRole) {
    setSelectedRole(user.currentRole);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v) {
        setNewPassword("");
        setShowPassword(false);
      }
      onOpenChange(v);
    }}>
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

        <Separator />

        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Resetar Senha
          </Label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Nova senha (mín. 6 caracteres)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleResetPassword}
            disabled={resetPasswordMutation.isPending || newPassword.length < 6}
          >
            {resetPasswordMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Resetar Senha
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
