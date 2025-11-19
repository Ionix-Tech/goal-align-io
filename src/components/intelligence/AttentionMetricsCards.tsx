import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Calendar, TrendingDown, Bell } from "lucide-react";

interface AttentionMetricsCardsProps {
  criticalCount: number;
  dueTodayCount: number;
  atRiskCount: number;
  noUpdateCount: number;
}

const AttentionMetricsCards = ({
  criticalCount,
  dueTodayCount,
  atRiskCount,
  noUpdateCount,
}: AttentionMetricsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="border-red-500/20 bg-red-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Atrasado</p>
              <p className="text-3xl font-bold text-red-600">{criticalCount}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-orange-500/20 bg-orange-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Vence Hoje</p>
              <p className="text-3xl font-bold text-orange-600">{dueTodayCount}</p>
            </div>
            <Calendar className="h-8 w-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-yellow-500/20 bg-yellow-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Projetos em Risco</p>
              <p className="text-3xl font-bold text-yellow-600">{atRiskCount}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-yellow-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sem Atualização</p>
              <p className="text-3xl font-bold text-blue-600">{noUpdateCount}</p>
            </div>
            <Bell className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttentionMetricsCards;
