import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lightbulb, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

interface Manager {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

const QuickIdea = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role } = useUserRole();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedManager, setSelectedManager] = useState("");
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(false);


  // Buscar gestores PMO
  useEffect(() => {
    const fetchManagers = async () => {
      // Primeiro buscar IDs dos gestores
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'pmo_manager');

      if (rolesData && rolesData.length > 0) {
        const managerIds = rolesData.map(r => r.user_id);
        
        // Depois buscar perfis
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .in('id', managerIds);

        if (error) {
          console.error('Error fetching managers:', error);
          toast.error("Erro ao carregar gestores");
        } else {
          setManagers(data || []);
        }
      }
    };

    fetchManagers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    if (!description.trim()) {
      toast.error("Descrição é obrigatória");
      return;
    }

    if (!selectedManager) {
      toast.error("Selecione um gestor para atribuir a ideia");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: title,
          description: description,
          status: 'idea',
          created_by: user?.id,
          assigned_to: selectedManager,
        })
        .select()
        .single();

      if (error) throw error;

      const managerName = managers.find(m => m.id === selectedManager)?.full_name;
      toast.success("Ideia criada com sucesso!", {
        description: `Atribuída para ${managerName}`
      });
      navigate('/strategy');
    } catch (error) {
      console.error('Error creating idea:', error);
      toast.error("Erro ao criar ideia");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-3xl py-8 px-4">
      <Button
        variant="ghost"
        onClick={() => navigate('/strategy')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Lightbulb className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Nova Ideia Rápida</h1>
        </div>
        <p className="text-muted-foreground">
          Registre uma ideia estratégica e atribua um gestor PMO para estruturá-la
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Ideia</CardTitle>
            <CardDescription>
              Compartilhe sua visão de forma simples. O gestor irá estruturar os detalhes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Título da Ideia */}
            <div className="space-y-2">
              <Label htmlFor="title">Título da Ideia *</Label>
              <Input
                id="title"
                placeholder="Ex: Automatizar processo de vendas"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Descrição da Ideia */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                placeholder="Descreva a ideia, o problema que resolve ou a oportunidade que identifica..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            {/* Atribuir para Gestor */}
            <div className="space-y-2">
              <Label htmlFor="manager">Atribuir para Gestor PMO *</Label>
              <Select value={selectedManager} onValueChange={setSelectedManager}>
                <SelectTrigger id="manager">
                  <SelectValue placeholder="Selecione um gestor" />
                </SelectTrigger>
                <SelectContent>
                  {managers.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      Nenhum gestor PMO cadastrado
                    </div>
                  ) : (
                    managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={manager.avatar_url || undefined} />
                            <AvatarFallback>{manager.full_name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium">{manager.full_name}</span>
                            <span className="text-xs text-muted-foreground">{manager.email}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Botões de ação */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/strategy')}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Criando..." : "Criar Ideia"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default QuickIdea;
