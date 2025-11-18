import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, FileText, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface InitiativeTypeSelectorProps {
  open: boolean;
  onClose: () => void;
}

export function InitiativeTypeSelector({ open, onClose }: InitiativeTypeSelectorProps) {
  const navigate = useNavigate();

  const handleSelect = (type: 'idea' | 'project' | 'action_plan') => {
    onClose();
    
    switch (type) {
      case 'idea':
        navigate('/quick-idea');
        break;
      case 'project':
        navigate('/create-project');
        break;
      case 'action_plan':
        navigate('/create-action-plan');
        break;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>O que você quer criar?</DialogTitle>
          <DialogDescription>
            Escolha o tipo de iniciativa mais adequado para sua necessidade
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <Card 
            className="cursor-pointer hover:bg-accent/50 transition-colors border-2 hover:border-primary"
            onClick={() => handleSelect('idea')}
          >
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Lightbulb className="h-6 w-6 text-yellow-600" />
                </div>
                <CardTitle className="text-lg">💡 Ideia</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Registre rapidamente uma ideia para análise futura. Apenas nome e descrição.
              </CardDescription>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:bg-accent/50 transition-colors border-2 hover:border-primary"
            onClick={() => handleSelect('project')}
          >
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">📋 Projeto</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Iniciativa estruturada com sponsor, indicadores, requisitos e governança completa.
              </CardDescription>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:bg-accent/50 transition-colors border-2 hover:border-primary"
            onClick={() => handleSelect('action_plan')}
          >
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-lg">⚡ Plano de Ação</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Plano enxuto (2 semanas a 1,5 mês) com 5W2H. Menos burocracia, mais agilidade.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
