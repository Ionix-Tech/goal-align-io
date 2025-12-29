import { useTeamMembers } from "@/hooks/useTeamMembers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, Crown, UserCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const roleConfig: Record<string, { label: string; icon: typeof Crown; variant: "default" | "secondary" | "outline" }> = {
  ceo: { label: "CEO", icon: Crown, variant: "default" },
  pmo_manager: { label: "PMO Manager", icon: Shield, variant: "secondary" },
  project_member: { label: "Membro", icon: UserCheck, variant: "outline" }
};

export function TeamSettings() {
  const { data: members = [], isLoading: loading } = useTeamMembers();

  // Fetch roles for all team members
  const { data: userRoles } = useQuery({
    queryKey: ['all-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role');
      if (error) throw error;
      return data;
    }
  });

  const getRoleForUser = (userId: string) => {
    const userRole = userRoles?.find(r => r.user_id === userId);
    return userRole?.role || 'project_member';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Equipe
          </CardTitle>
          <CardDescription>
            Membros cadastrados no sistema ({members.length} membros)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum membro encontrado
            </div>
          ) : (
            <div className="divide-y">
              {members.map((member) => {
                const role = getRoleForUser(member.id);
                const config = roleConfig[role] || roleConfig.project_member;
                const Icon = config.icon;

                return (
                  <div key={member.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10">
                          {getInitials(member.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.full_name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <Badge variant={config.variant} className="flex items-center gap-1">
                      <Icon className="h-3 w-3" />
                      {config.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
