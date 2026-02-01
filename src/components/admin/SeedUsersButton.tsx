import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { UserPlus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SeedResult {
  email: string;
  status: string;
  error?: string;
}

export function SeedUsersButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SeedResult[]>([]);

  const handleSeed = async () => {
    setLoading(true);
    setResults([]);
    try {
      const { data, error } = await supabase.functions.invoke('seed-users', {
        body: {},
      });
      if (error) throw error;
      setResults(data?.results || []);
      const created = data?.results?.filter((r: SeedResult) => r.status === 'created').length || 0;
      toast.success(`${created} usuário(s) criado(s) com sucesso`);
    } catch (err) {
      console.error('Seed error:', err);
      toast.error("Erro ao criar usuários. Verifique se a função está configurada.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start gap-2"
        onClick={() => setOpen(true)}
      >
        <UserPlus className="h-4 w-4" />
        Criar Usuários Padrão
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Criar Usuários Padrão</DialogTitle>
            <DialogDescription>
              Cria 16 usuários pré-configurados (1 CEO, 1 PMO, 14 membros) com senha padrão.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Button onClick={handleSeed} disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
              {loading ? "Criando..." : "Criar Usuários"}
            </Button>

            {results.length > 0 && (
              <div className="max-h-60 overflow-y-auto space-y-1 text-sm">
                {results.map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b last:border-0">
                    <span className="truncate">{r.email}</span>
                    <span className={
                      r.status === 'created' ? 'text-green-600' :
                      r.status === 'already_exists' ? 'text-yellow-600' :
                      'text-red-600'
                    }>
                      {r.status === 'created' ? 'Criado' :
                       r.status === 'already_exists' ? 'Já existe' :
                       'Erro'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
