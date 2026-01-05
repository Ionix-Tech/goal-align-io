import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, Shield, Users, Pencil, UserCheck } from "lucide-react";
import { CreateUserDialog } from "./CreateUserDialog";
import { EditUserRoleDialog } from "./EditUserRoleDialog";

type AppRole = "ceo" | "pmo_manager" | "project_member";

const roleConfig: Record<AppRole, { label: string; icon: typeof Crown; variant: "default" | "secondary" | "outline" }> = {
  ceo: { label: "CEO", icon: Crown, variant: "default" },
  pmo_manager: { label: "PMO Manager", icon: Shield, variant: "secondary" },
  project_member: { label: "Membro", icon: UserCheck, variant: "outline" },
};

export function TeamSettings() {
  const { data: members, isLoading: membersLoading } = useTeamMembers();
  const { role: currentUserRole } = useUserRole();
  const [editingUser, setEditingUser] = useState<{
    id: string;
    full_name: string;
    email: string;
    currentRole: AppRole;
  } | null>(null);

  const { data: userRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ['user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (error) throw error;
      return data || [];
    }
  });

  const getRoleForUser = (userId: string): AppRole => {
    const role = userRoles?.find(r => r.user_id === userId);
    return (role?.role as AppRole) || 'project_member';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isLoading = membersLoading || rolesLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const canEditRoles = currentUserRole === 'ceo';
  const canCreateUsers = currentUserRole === 'ceo' || currentUserRole === 'pmo_manager';

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Equipe
            </CardTitle>
            <CardDescription>
              Gerencie os membros da equipe e suas funções ({members?.length || 0} membros)
            </CardDescription>
          </div>
          {canCreateUsers && (
            <CreateUserDialog userRole={currentUserRole as AppRole | null} />
          )}
        </CardHeader>
        <CardContent>
          {!members || members.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum membro encontrado
            </p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => {
                const role = getRoleForUser(member.id);
                const config = roleConfig[role];
                const RoleIcon = config.icon;
                
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(member.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.full_name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={config.variant} className="gap-1">
                        <RoleIcon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                      {canEditRoles && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            setEditingUser({
                              id: member.id,
                              full_name: member.full_name,
                              email: member.email,
                              currentRole: role,
                            })
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <EditUserRoleDialog
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        user={editingUser}
      />
    </>
  );
}
