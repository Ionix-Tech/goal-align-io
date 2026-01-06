import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckSquare, Target, TrendingUp, Folder, ArrowRight } from "lucide-react";
import { AttentionItem as AttentionItemType } from "@/hooks/useAttentionPoints";
import { useNavigate } from "react-router-dom";

interface AttentionItemProps {
  item: AttentionItemType;
}

const AttentionItem = ({ item }: AttentionItemProps) => {
  const navigate = useNavigate();

  const getTypeIcon = () => {
    switch (item.type) {
      case 'task':
        return <CheckSquare className="h-4 w-4" />;
      case 'milestone':
        return <Target className="h-4 w-4" />;
      case 'indicator':
        return <TrendingUp className="h-4 w-4" />;
      case 'project':
        return <Folder className="h-4 w-4" />;
    }
  };

  const getTypeLabel = () => {
    switch (item.type) {
      case 'task':
        return 'Tarefa';
      case 'milestone':
        return 'Marco';
      case 'indicator':
        return 'Indicador';
      case 'project':
        return 'Projeto';
    }
  };

  const getStatusBadge = () => {
    if (item.healthStatus) {
      const colors = {
        red: 'bg-red-500/10 text-red-700 border-red-500/20',
        yellow: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
        green: 'bg-green-500/10 text-green-700 border-green-500/20',
      };
      return (
        <Badge variant="outline" className={colors[item.healthStatus as keyof typeof colors]}>
          {item.healthStatus === 'red' ? 'Crítico' : item.healthStatus === 'yellow' ? 'Atenção' : 'Saudável'}
        </Badge>
      );
    }
    if (item.status) {
      return <Badge variant="outline">{item.status}</Badge>;
    }
    return null;
  };

  const getDaysLabel = () => {
    if (item.daysOverdue && item.daysOverdue > 0) {
      return (
        <span className="text-sm font-medium text-red-600">
          {item.daysOverdue} {item.daysOverdue === 1 ? 'dia' : 'dias'} atrasado
        </span>
      );
    }
    if (item.daysRemaining !== undefined) {
      if (item.daysRemaining === 0) {
        return <span className="text-sm font-medium text-orange-600">Vence hoje</span>;
      }
      return (
        <span className="text-sm font-medium text-yellow-600">
          {item.daysRemaining} {item.daysRemaining === 1 ? 'dia' : 'dias'} restantes
        </span>
      );
    }
    return null;
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-start gap-4 flex-1">
        <div className="mt-1">{getTypeIcon()}</div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="gap-1">
              <Folder className="h-3 w-3" />
              {item.projectName}
            </Badge>
            {item.thesisName && (
              <Badge variant="secondary" className="text-xs">
                {item.thesisName}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {getTypeLabel()}
            </Badge>
          </div>
          
          <p className="font-medium">{item.title}</p>
          
          <div className="flex items-center gap-3 flex-wrap">
            {item.assignedToName && (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {item.assignedToName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">{item.assignedToName}</span>
              </div>
            )}
            {getStatusBadge()}
            {getDaysLabel()}
          </div>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(`/projects/${item.projectId}`)}
        className="ml-4"
      >
        Abrir
        <ArrowRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
};

export default AttentionItem;
