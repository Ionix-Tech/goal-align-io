import { useState, useMemo } from 'react';
import { useKPIDetails, useUpdateKPI, useDeleteKPI, KPIMonthlyValue, KPIStatus, KPIDirection } from '@/hooks/useKPIs';
import { useUpdateKPIMonthlyValue } from '@/hooks/useKPIMonthlyValues';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Target, Building2, Crosshair, Edit2, Check, X, Link2, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useUserRole } from '@/hooks/useUserRole';
import { useNavigate } from 'react-router-dom';

interface KPIDetailDialogProps {
  kpiId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const statusColors: Record<KPIStatus, string> = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500'
};

const typeLabels: Record<string, string> = {
  strategic: 'Estratégico',
  area: 'Área',
  control: 'Controle'
};

const directionLabels: Record<string, string> = {
  higher_better: 'Maior é melhor',
  lower_better: 'Menor é melhor'
};

export function KPIDetailDialog({ kpiId, open, onOpenChange }: KPIDetailDialogProps) {
  const { data: kpi, isLoading } = useKPIDetails(kpiId || undefined);
  const updateMonthlyValue = useUpdateKPIMonthlyValue();
  const updateKPI = useUpdateKPI();
  const deleteKPI = useDeleteKPI();
  const { isManager } = useUserRole();
  const navigate = useNavigate();

  const [editingMonth, setEditingMonth] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{ target: string; actual: string }>({ target: '', actual: '' });

  // KPI metadata editing
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [metaValues, setMetaValues] = useState({ name: '', description: '', unit: '', direction: '' as KPIDirection });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Calculate summary stats
  const summary = useMemo(() => {
    if (!kpi?.monthly_values) return null;

    const currentYear = new Date().getFullYear();
    const yearValues = kpi.monthly_values.filter(v => v.year === currentYear);
    const withActual = yearValues.filter(v => v.actual_value !== null);

    if (withActual.length === 0) return null;

    const actuals = withActual.map(v => v.actual_value!);
    const targets = withActual.filter(v => v.target_value).map(v => v.target_value!);
    
    const sumActual = actuals.reduce((a, b) => a + b, 0);
    const sumTarget = targets.reduce((a, b) => a + b, 0);

    return {
      min: Math.min(...actuals),
      max: Math.max(...actuals),
      avg: sumActual / actuals.length,
      ytdActual: sumActual,
      ytdTarget: sumTarget,
      ytdAchievement: sumTarget > 0 ? (sumActual / sumTarget) * 100 : null
    };
  }, [kpi]);

  // Chart data
  const chartData = useMemo(() => {
    if (!kpi?.monthly_values) return [];

    const currentYear = new Date().getFullYear();
    return kpi.monthly_values
      .filter(v => v.year === currentYear)
      .map(v => ({
        month: MONTHS[v.month - 1],
        meta: v.target_value,
        realizado: v.actual_value
      }));
  }, [kpi]);

  const handleEditStart = (monthValue: KPIMonthlyValue) => {
    setEditingMonth(monthValue.month);
    setEditValues({
      target: monthValue.target_value?.toString() || '',
      actual: monthValue.actual_value?.toString() || ''
    });
  };

  const handleEditSave = async (monthValue: KPIMonthlyValue) => {
    await updateMonthlyValue.mutateAsync({
      id: monthValue.id,
      kpi_id: monthValue.kpi_id,
      target_value: editValues.target ? parseFloat(editValues.target) : null,
      actual_value: editValues.actual ? parseFloat(editValues.actual) : null
    });
    setEditingMonth(null);
  };

  const handleEditCancel = () => {
    setEditingMonth(null);
    setEditValues({ target: '', actual: '' });
  };

  const handleMetaEditStart = () => {
    if (!kpi) return;
    setMetaValues({
      name: kpi.name,
      description: kpi.description || '',
      unit: kpi.unit,
      direction: kpi.direction
    });
    setIsEditingMeta(true);
  };

  const handleMetaSave = async () => {
    if (!kpi || !metaValues.name.trim()) return;
    await updateKPI.mutateAsync({
      id: kpi.id,
      name: metaValues.name.trim(),
      description: metaValues.description.trim() || undefined,
      unit: metaValues.unit.trim(),
      direction: metaValues.direction
    });
    setIsEditingMeta(false);
  };

  const handleMetaCancel = () => {
    setIsEditingMeta(false);
  };

  const handleDelete = async () => {
    if (!kpi) return;
    await deleteKPI.mutateAsync(kpi.id);
    setShowDeleteConfirm(false);
    onOpenChange(false);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </DialogContent>
      </Dialog>
    );
  }

  if (!kpi) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {(isEditingMeta ? metaValues.direction : kpi.direction) === 'higher_better' ? (
                <TrendingUp className="h-6 w-6 text-green-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-blue-600" />
              )}
              <div className="flex-1">
                {isEditingMeta ? (
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Nome</Label>
                      <Input
                        value={metaValues.name}
                        onChange={(e) => setMetaValues({ ...metaValues, name: e.target.value })}
                        className="h-9 text-lg font-semibold"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Descrição</Label>
                      <Input
                        value={metaValues.description}
                        onChange={(e) => setMetaValues({ ...metaValues, description: e.target.value })}
                        placeholder="Descrição do indicador"
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <DialogTitle className="text-xl">{kpi.name}</DialogTitle>
                    <p className="text-sm text-muted-foreground">{kpi.description}</p>
                  </>
                )}
              </div>
            </div>
            {isManager && !isEditingMeta && (
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleMetaEditStart} title="Editar">
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
            {isEditingMeta && (
              <div className="flex items-center gap-1 shrink-0">
                <Button size="sm" onClick={handleMetaSave} disabled={updateKPI.isPending || !metaValues.name.trim()} className="gap-1">
                  <Check className="h-4 w-4" />
                  Salvar
                </Button>
                <Button variant="ghost" size="sm" onClick={handleMetaCancel} className="gap-1">
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* KPI Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div>
            <p className="text-xs text-muted-foreground">Tipo</p>
            <Badge variant="outline">{typeLabels[kpi.kpi_type]}</Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Unidade</p>
            {isEditingMeta ? (
              <Input
                value={metaValues.unit}
                onChange={(e) => setMetaValues({ ...metaValues, unit: e.target.value })}
                className="h-8 w-24 text-sm"
              />
            ) : (
              <p className="font-medium">{kpi.unit}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Direção</p>
            {isEditingMeta ? (
              <Select value={metaValues.direction} onValueChange={(v: KPIDirection) => setMetaValues({ ...metaValues, direction: v })}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="higher_better">Maior é melhor</SelectItem>
                  <SelectItem value="lower_better">Menor é melhor</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="font-medium text-sm">{directionLabels[kpi.direction]}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Responsável</p>
            <p className="font-medium text-sm">{kpi.owner?.full_name}</p>
          </div>
        </div>

        {/* Hierarchy info */}
        {(kpi.pillar || kpi.objective || kpi.area) && (
          <div className="flex flex-wrap gap-2 mt-2">
            {kpi.pillar && (
              <Badge variant="secondary">Pilar: {kpi.pillar.name}</Badge>
            )}
            {kpi.objective && (
              <Badge variant="secondary">Objetivo: {kpi.objective.name}</Badge>
            )}
            {kpi.area && (
              <Badge variant="secondary">Área: {kpi.area.name}</Badge>
            )}
          </div>
        )}

        <Tabs defaultValue="values" className="mt-4">
          <TabsList>
            <TabsTrigger value="values">Valores Mensais</TabsTrigger>
            <TabsTrigger value="chart">Gráfico</TabsTrigger>
            <TabsTrigger value="projects">Projetos ({kpi.project_links?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="values" className="mt-4">
            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">Mínimo</p>
                    <p className="text-lg font-bold">{summary.min.toLocaleString()} {kpi.unit}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">Máximo</p>
                    <p className="text-lg font-bold">{summary.max.toLocaleString()} {kpi.unit}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">Média</p>
                    <p className="text-lg font-bold">{summary.avg.toFixed(1)} {kpi.unit}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">YTD Realizado</p>
                    <p className="text-lg font-bold">{summary.ytdActual.toLocaleString()} {kpi.unit}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">YTD Atingimento</p>
                    <p className="text-lg font-bold">
                      {summary.ytdAchievement !== null ? `${summary.ytdAchievement.toFixed(1)}%` : 'N/A'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Monthly Values Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead className="text-right">Meta</TableHead>
                    <TableHead className="text-right">Realizado</TableHead>
                    <TableHead className="text-right">Atingimento</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    {isManager && <TableHead className="w-[80px]"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kpi.monthly_values?.map(monthValue => {
                    const achievement = monthValue.target_value && monthValue.actual_value
                      ? (monthValue.actual_value / monthValue.target_value) * 100
                      : null;
                    const isEditing = editingMonth === monthValue.month;

                    return (
                      <TableRow key={monthValue.id}>
                        <TableCell className="font-medium">{MONTHS[monthValue.month - 1]}</TableCell>
                        <TableCell className="text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editValues.target}
                              onChange={(e) => setEditValues({ ...editValues, target: e.target.value })}
                              className="w-24 h-8 text-right"
                            />
                          ) : (
                            monthValue.target_value?.toLocaleString() ?? '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editValues.actual}
                              onChange={(e) => setEditValues({ ...editValues, actual: e.target.value })}
                              className="w-24 h-8 text-right"
                            />
                          ) : (
                            monthValue.actual_value?.toLocaleString() ?? '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {achievement !== null ? `${achievement.toFixed(1)}%` : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          {monthValue.status && (
                            <div className={cn("h-4 w-4 rounded-full mx-auto", statusColors[monthValue.status])} />
                          )}
                        </TableCell>
                        {isManager && (
                          <TableCell>
                            {isEditing ? (
                              <div className="flex gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => handleEditSave(monthValue)}
                                  disabled={updateMonthlyValue.isPending}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={handleEditCancel}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => handleEditStart(monthValue)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="chart" className="mt-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="meta"
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="5 5"
                    name="Meta"
                  />
                  <Line
                    type="monotone"
                    dataKey="realizado"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Realizado"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="projects" className="mt-4">
            {kpi.project_links && kpi.project_links.length > 0 ? (
              <div className="space-y-2">
                {kpi.project_links.map(link => (
                  <div
                    key={link.project_id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => {
                      onOpenChange(false);
                      navigate(`/project/${link.project_id}/execution`);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                      <span>{link.project_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum projeto vinculado a este KPI.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir "{kpi.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá <strong>desativar</strong> o indicador permanentemente.
              Ele não aparecerá mais na listagem de KPIs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleteKPI.isPending}
            >
              Excluir indicador
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
