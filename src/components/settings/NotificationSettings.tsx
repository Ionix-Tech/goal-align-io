import { useNotifications } from "@/hooks/useNotifications";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, AlertCircle, Info, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const typeConfig: Record<string, { icon: typeof Bell; className: string }> = {
  status_change: { icon: AlertCircle, className: "text-blue-500" },
  approval: { icon: CheckCircle2, className: "text-green-500" },
  comment: { icon: Info, className: "text-yellow-500" },
  default: { icon: Bell, className: "text-muted-foreground" }
};

export function NotificationSettings() {
  const { notifications, isLoading, markAsRead, unreadCount } = useNotifications();

  const getTypeConfig = (type: string) => {
    return typeConfig[type] || typeConfig.default;
  };

  if (isLoading) {
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações
              </CardTitle>
              <CardDescription>
                Suas notificações recentes
              </CardDescription>
            </div>
            {unreadCount > 0 && (
              <Badge variant="secondary">
                {unreadCount} não lidas
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nenhuma notificação encontrada</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const config = getTypeConfig(notification.type);
                const Icon = config.icon;

                return (
                  <div 
                    key={notification.id} 
                    className={`flex items-start gap-4 py-4 first:pt-0 last:pb-0 ${
                      !notification.read ? 'bg-primary/5 -mx-4 px-4 rounded-lg' : ''
                    }`}
                  >
                    <div className={`mt-1 ${config.className}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </p>
                    </div>
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="shrink-0"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
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
