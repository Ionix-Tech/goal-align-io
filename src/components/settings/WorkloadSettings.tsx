import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Save, RotateCcw, Users, FolderKanban, Info } from "lucide-react";
import { useWorkloadSettings } from "@/hooks/useWorkloadSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { WORKLOAD_RULES } from "@/config/workloadRules";

export function WorkloadSettings() {
  const { settings, isLoading, updateSettings, isUpdating } = useWorkloadSettings();
  const [formData, setFormData] = useState<Record<string, number>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data when settings load
  useEffect(() => {
    if (settings) {
      setFormData(settings);
      setHasChanges(false);
    }
  }, [settings]);

  const handleChange = (key: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setFormData((prev) => ({ ...prev, [key]: numValue }));
      setHasChanges(true);
    }
  };

  const handleSave = () => {
    const updates = Object.entries(formData)
      .filter(([key, value]) => settings[key] !== value)
      .map(([key, value]) => ({ key, value }));

    if (updates.length > 0) {
      updateSettings(updates);
    }
  };

  const handleReset = () => {
    // Reset to default values from config
    const defaults: Record<string, number> = {
      tasks_low_max: WORKLOAD_RULES.tasks.thresholds.low,
      tasks_medium_max: WORKLOAD_RULES.tasks.thresholds.medium,
      tasks_high_max: WORKLOAD_RULES.tasks.thresholds.high,
      leadership_overloaded_critical: WORKLOAD_RULES.leadership.thresholds.overloadedCritical,
      leadership_high_critical: WORKLOAD_RULES.leadership.thresholds.highCritical,
      leadership_high_projects: WORKLOAD_RULES.leadership.thresholds.highProjects,
      leadership_medium_critical: WORKLOAD_RULES.leadership.thresholds.mediumCritical,
      leadership_medium_projects: WORKLOAD_RULES.leadership.thresholds.mediumProjects,
    };
    setFormData(defaults);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Task Workload Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Carga de Tarefas</CardTitle>
          </div>
          <CardDescription>
            Define os limites de tarefas ativas para classificar a carga de trabalho de cada membro da equipe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="tasks_low_max">Carga Baixa (até)</Label>
                <Badge variant="default" className="text-xs">Baixa</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="tasks_low_max"
                  type="number"
                  min={1}
                  value={formData.tasks_low_max ?? 5}
                  onChange={(e) => handleChange("tasks_low_max", e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">tarefas</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="tasks_medium_max">Carga Média (até)</Label>
                <Badge variant="secondary" className="text-xs">Média</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="tasks_medium_max"
                  type="number"
                  min={1}
                  value={formData.tasks_medium_max ?? 10}
                  onChange={(e) => handleChange("tasks_medium_max", e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">tarefas</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="tasks_high_max">Carga Alta (até)</Label>
                <Badge variant="outline" className="text-xs">Alta</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="tasks_high_max"
                  type="number"
                  min={1}
                  value={formData.tasks_high_max ?? 15}
                  onChange={(e) => handleChange("tasks_high_max", e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">tarefas</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
            <Info className="h-4 w-4 shrink-0" />
            <span>
              Acima de <strong>{formData.tasks_high_max ?? 15}</strong> tarefas ativas, o membro será considerado <Badge variant="destructive" className="text-xs mx-1">Sobrecarregado</Badge>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Project Leadership Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Liderança de Projetos</CardTitle>
          </div>
          <CardDescription>
            Define os limites para classificar a carga de liderança baseado no número de projetos e projetos críticos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overloaded Threshold */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="font-medium">Sobrecarregado</Label>
              <Badge variant="destructive" className="text-xs">Crítico</Badge>
              <HelpTooltip content="Líder será marcado como sobrecarregado quando atingir este número de projetos críticos" />
            </div>
            <div className="flex items-center gap-2">
              <Input
                id="leadership_overloaded_critical"
                type="number"
                min={1}
                value={formData.leadership_overloaded_critical ?? 3}
                onChange={(e) => handleChange("leadership_overloaded_critical", e.target.value)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">ou mais projetos críticos</span>
            </div>
          </div>

          <Separator />

          {/* High Threshold */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="font-medium">Carga Alta</Label>
              <Badge variant="outline" className="text-xs">Alta</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Input
                  id="leadership_high_critical"
                  type="number"
                  min={1}
                  value={formData.leadership_high_critical ?? 2}
                  onChange={(e) => handleChange("leadership_high_critical", e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">ou mais projetos críticos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">OU mais de</span>
                <Input
                  id="leadership_high_projects"
                  type="number"
                  min={1}
                  value={formData.leadership_high_projects ?? 5}
                  onChange={(e) => handleChange("leadership_high_projects", e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">projetos</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Medium Threshold */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="font-medium">Carga Média</Label>
              <Badge variant="secondary" className="text-xs">Média</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Input
                  id="leadership_medium_critical"
                  type="number"
                  min={1}
                  value={formData.leadership_medium_critical ?? 1}
                  onChange={(e) => handleChange("leadership_medium_critical", e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">ou mais projetos críticos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">OU mais de</span>
                <Input
                  id="leadership_medium_projects"
                  type="number"
                  min={1}
                  value={formData.leadership_medium_projects ?? 3}
                  onChange={(e) => handleChange("leadership_medium_projects", e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">projetos</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
            <Info className="h-4 w-4 shrink-0" />
            <span>
              Líderes com menos projetos e sem projetos críticos são considerados com carga <Badge variant="default" className="text-xs mx-1">Controlada</Badge>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleReset} disabled={isUpdating}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Restaurar Padrões
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges || isUpdating}>
          <Save className="h-4 w-4 mr-2" />
          {isUpdating ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
}
