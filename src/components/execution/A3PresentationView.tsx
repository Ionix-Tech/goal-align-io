import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Target,
  Users,
  ArrowRight,
  CheckCircle2,
  Circle,
  Flame,
  BarChart3,
  CalendarDays,
  Presentation,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import type { ProjectDetails } from '@/hooks/useProjectDetails';
import type { ProjectSituation } from '@/hooks/useProjectSituations';

interface A3PresentationViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectDetails;
  situations: ProjectSituation[];
}

const strategicPillars: Record<string, { label: string; color: string }> = {
  operational_efficiency: { label: 'Eficiencia Operacional', color: 'bg-blue-600' },
  sales_expansion: { label: 'Expansao de Vendas', color: 'bg-green-600' },
  new_business: { label: 'Novos Negocios', color: 'bg-purple-600' },
};

function SituationImage({ filePath, alt }: { filePath: string; alt: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchUrl = async () => {
      const { data } = await supabase.storage
        .from('project-attachments')
        .createSignedUrl(filePath, 3600);
      if (data?.signedUrl) setImageUrl(data.signedUrl);
    };
    fetchUrl();
  }, [filePath]);

  if (!imageUrl) return null;

  return (
    <img
      src={imageUrl}
      alt={alt}
      className="w-full max-h-[300px] object-contain rounded-lg border"
    />
  );
}

export function A3PresentationView({
  open,
  onOpenChange,
  project,
  situations,
}: A3PresentationViewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Reset slide on open
  useEffect(() => {
    if (open) setCurrentSlide(0);
  }, [open]);

  const pillar = project.strategic_pillar
    ? strategicPillars[project.strategic_pillar]
    : null;

  const completedMilestones = project.milestones.filter(m => m.completed).length;
  const totalMilestones = project.milestones.length;
  const milestoneProgress = totalMilestones > 0
    ? Math.round((completedMilestones / totalMilestones) * 100)
    : 0;

  const completedTasks = project.tasks?.filter(t => t.status === 'completed').length || 0;
  const totalTasks = project.tasks?.length || 0;

  // Get image attachments from situations
  const situationImages = situations.flatMap(s =>
    (s.attachments || [])
      .filter((a: any) => a.file_type?.startsWith('image/'))
      .map((a: any) => ({ ...a, situation: s }))
  );

  // Build slides
  const slides: Array<{
    id: string;
    title: string;
    render: () => React.ReactNode;
  }> = [];

  // Slide 1: Cover
  slides.push({
    id: 'cover',
    title: 'Capa',
    render: () => (
      <div className="flex flex-col items-center justify-center h-full gap-8 text-center px-8">
        {pillar && (
          <Badge className={cn('text-white text-sm px-4 py-1', pillar.color)}>
            {pillar.label}
          </Badge>
        )}
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">{project.name}</h1>
          {project.is_critical && (
            <Badge variant="destructive" className="text-base gap-2 px-4 py-1">
              <Flame className="h-4 w-4" />
              Projeto Critico
            </Badge>
          )}
        </div>
        {project.objective && (
          <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
            {project.objective}
          </p>
        )}
        <div className="flex items-center gap-6 text-muted-foreground mt-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span className="text-base">
              <strong>Lider:</strong> {project.assignee?.full_name || project.creator?.full_name || '--'}
            </span>
          </div>
          {project.members.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-base">
                <strong>Equipe:</strong> {project.members.map(m => m.user.full_name).join(', ')}
              </span>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-auto">
          {format(new Date(), "'Apresentacao em' dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>
    ),
  });

  // Slide 2: Diagnostico (Situacao Atual vs Alvo)
  if (situations.length > 0) {
    slides.push({
      id: 'diagnosis',
      title: 'Diagnostico',
      render: () => (
        <div className="flex flex-col h-full px-8 py-4">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Target className="h-8 w-8 text-primary" />
            Diagnostico
          </h2>
          <div className="flex-1 space-y-6 overflow-y-auto">
            {situations.map((situation, index) => {
              const hasCurrentImage = !!situation.current_image_path;
              const hasTargetImage = !!situation.target_image_path;
              const hasAnyImage = hasCurrentImage || hasTargetImage;
              // Fallback: legacy generic image attachments
              const legacyImages = (situation.attachments || []).filter(
                (a: any) => a.file_type?.startsWith('image/')
              );

              return (
                <div key={situation.id} className="space-y-4">
                  {index > 0 && <Separator className="my-4" />}
                  <div className="grid grid-cols-2 gap-8">
                    {/* Situacao Atual */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <h3 className="font-semibold text-lg">Situacao Atual</h3>
                      </div>
                      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg p-4">
                        <p className="text-base leading-relaxed">{situation.current_problem}</p>
                      </div>
                      {hasCurrentImage && (
                        <SituationImage
                          filePath={situation.current_image_path!}
                          alt="Situacao Atual"
                        />
                      )}
                    </div>

                    {/* Situacao Alvo */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <h3 className="font-semibold text-lg">Situacao Alvo</h3>
                      </div>
                      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-lg p-4">
                        <p className="text-base leading-relaxed">{situation.target_goal}</p>
                      </div>
                      {hasTargetImage && (
                        <SituationImage
                          filePath={situation.target_image_path!}
                          alt="Situacao Alvo"
                        />
                      )}
                    </div>
                  </div>

                  {/* Fallback: legacy generic attachments (if no dedicated images) */}
                  {!hasAnyImage && legacyImages.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      {legacyImages.map((img: any) => (
                        <SituationImage
                          key={img.id}
                          filePath={img.file_path}
                          alt={img.file_name}
                        />
                      ))}
                    </div>
                  )}

                  {/* Situation indicators */}
                  {situation.indicators && situation.indicators.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-2">
                      {situation.indicators.map((ind: any) => (
                        <Badge key={ind.id} variant="secondary" className="text-sm px-3 py-1">
                          {ind.name}: {ind.current_value} <ArrowRight className="h-3 w-3 mx-1 inline" /> {ind.target_value} {ind.unit}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ),
    });
  }

  // Slide 3: Indicadores
  if (project.indicators.length > 0 || project.linkedKPI) {
    slides.push({
      id: 'indicators',
      title: 'Indicadores',
      render: () => (
        <div className="flex flex-col h-full px-8 py-4">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Indicadores
          </h2>
          <div className="flex-1 space-y-6 overflow-y-auto">
            {/* Strategic KPI */}
            {project.linkedKPI && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Indicador Estrategico</h3>
                  {project.thesis && (
                    <Badge variant="secondary">{project.thesis.name}</Badge>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="text-xl font-bold">{project.linkedKPI.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Atual</p>
                    <p className="text-3xl font-bold text-primary">
                      {project.linkedKPI.current_value ?? '--'}
                      {project.linkedKPI.unit && (
                        <span className="text-lg ml-1">{project.linkedKPI.unit}</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Meta</p>
                    <p className="text-3xl font-bold">
                      {project.linkedKPI.target_value}
                      {project.linkedKPI.unit && (
                        <span className="text-lg ml-1">{project.linkedKPI.unit}</span>
                      )}
                    </p>
                  </div>
                </div>
                {(() => {
                  const progress =
                    project.linkedKPI!.current_value && project.linkedKPI!.target_value
                      ? Math.min(
                          100,
                          (project.linkedKPI!.current_value / project.linkedKPI!.target_value) * 100
                        )
                      : 0;
                  return (
                    <div className="flex items-center gap-3">
                      <Progress value={progress} className="flex-1 h-3" />
                      <span className="text-lg font-bold w-16 text-right">
                        {Math.round(progress)}%
                      </span>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Project indicators */}
            {project.indicators.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {project.indicators.map(indicator => {
                  const progress = indicator.progress ?? 0;
                  return (
                    <div
                      key={indicator.id}
                      className="border rounded-xl p-5 space-y-3"
                    >
                      <h4 className="font-semibold text-base">{indicator.name}</h4>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Atual: <strong>{indicator.current_state}</strong> {indicator.unit}
                        </span>
                        <span className="text-muted-foreground">
                          Meta: <strong>{indicator.target_state}</strong> {indicator.unit}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress value={progress} className="flex-1 h-2" />
                        <span className="text-sm font-semibold w-12 text-right">
                          {progress}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ),
    });
  }

  // Slide 4: Milestones
  if (project.milestones.length > 0) {
    slides.push({
      id: 'milestones',
      title: 'Milestones',
      render: () => (
        <div className="flex flex-col h-full px-8 py-4">
          <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <CalendarDays className="h-8 w-8 text-primary" />
            Milestones
          </h2>
          <div className="flex items-center gap-4 mb-6">
            <Progress value={milestoneProgress} className="flex-1 h-3" />
            <span className="text-lg font-bold">{milestoneProgress}%</span>
            <Badge variant="secondary">
              {completedMilestones}/{totalMilestones} concluidos
            </Badge>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto">
            {project.milestones
              .sort(
                (a, b) =>
                  new Date(a.target_date).getTime() -
                  new Date(b.target_date).getTime()
              )
              .map(milestone => {
                const typeIcon =
                  milestone.milestone_type === 'decolagem'
                    ? '🚀'
                    : milestone.milestone_type === 'voo'
                    ? '✈️'
                    : milestone.milestone_type === 'escala'
                    ? '🌍'
                    : '📌';
                const isOverdue =
                  !milestone.completed &&
                  new Date(milestone.target_date) < new Date();

                return (
                  <div
                    key={milestone.id}
                    className={cn(
                      'flex items-center gap-4 p-4 border rounded-xl transition-colors',
                      milestone.completed
                        ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/30'
                        : isOverdue
                        ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30'
                        : 'bg-background'
                    )}
                  >
                    <span className="text-2xl">{typeIcon}</span>
                    {milestone.completed ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
                    ) : (
                      <Circle
                        className={cn(
                          'h-6 w-6 shrink-0',
                          isOverdue ? 'text-red-500' : 'text-muted-foreground'
                        )}
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-base">{milestone.title}</p>
                      {milestone.taskStats && milestone.taskStats.total > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {milestone.taskStats.completed}/{milestone.taskStats.total} acoes concluidas
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p
                        className={cn(
                          'font-medium',
                          isOverdue && !milestone.completed
                            ? 'text-red-600'
                            : 'text-muted-foreground'
                        )}
                      >
                        {format(new Date(milestone.target_date), 'dd/MM/yyyy')}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress
                          value={milestone.progress}
                          className="w-20 h-2"
                        />
                        <span className="text-sm font-medium">
                          {milestone.progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ),
    });
  }

  // Slide 5: Summary / Status
  slides.push({
    id: 'summary',
    title: 'Resumo',
    render: () => (
      <div className="flex flex-col h-full px-8 py-4">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <Presentation className="h-8 w-8 text-primary" />
          Resumo Executivo
        </h2>
        <div className="flex-1 grid grid-cols-2 gap-6">
          {/* Progress overview */}
          <div className="border rounded-xl p-6 space-y-6">
            <h3 className="text-xl font-semibold">Progresso Geral</h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Milestones</span>
                  <span className="font-semibold">
                    {completedMilestones}/{totalMilestones}
                  </span>
                </div>
                <Progress value={milestoneProgress} className="h-3" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Acoes</span>
                  <span className="font-semibold">
                    {completedTasks}/{totalTasks}
                  </span>
                </div>
                <Progress
                  value={totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}
                  className="h-3"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Indicadores</span>
                  <span className="font-semibold">
                    {project.indicators.length} em acompanhamento
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Team */}
          <div className="border rounded-xl p-6 space-y-4">
            <h3 className="text-xl font-semibold">Equipe</h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {(project.assignee?.full_name || project.creator?.full_name || 'U')[0]}
                </div>
                <div>
                  <p className="font-semibold">
                    {project.assignee?.full_name || project.creator?.full_name || '--'}
                  </p>
                  <p className="text-xs text-muted-foreground">Lider do Projeto</p>
                </div>
              </div>

              {project.members.map(member => (
                <div key={member.id} className="flex items-center gap-3 p-2">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    {member.user.full_name[0]}
                  </div>
                  <span className="text-sm">{member.user.full_name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming milestones */}
          <div className="border rounded-xl p-6 space-y-4 col-span-2">
            <h3 className="text-xl font-semibold">Proximos Marcos</h3>
            <div className="flex gap-4">
              {project.milestones
                .filter(m => !m.completed)
                .sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime())
                .slice(0, 4)
                .map(m => {
                  const isOverdue = new Date(m.target_date) < new Date();
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        'flex-1 border rounded-lg p-4',
                        isOverdue
                          ? 'border-red-300 bg-red-50 dark:bg-red-950/20'
                          : 'border-muted'
                      )}
                    >
                      <p className="font-medium text-sm">{m.title}</p>
                      <p
                        className={cn(
                          'text-xs mt-1',
                          isOverdue ? 'text-red-600 font-semibold' : 'text-muted-foreground'
                        )}
                      >
                        {format(new Date(m.target_date), 'dd/MM/yyyy')}
                      </p>
                      <Progress value={m.progress} className="h-1.5 mt-2" />
                    </div>
                  );
                })}
              {project.milestones.filter(m => !m.completed).length === 0 && (
                <p className="text-muted-foreground">Todos os milestones foram concluidos!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    ),
  });

  const totalSlides = slides.length;

  const goNext = () => setCurrentSlide(prev => Math.min(prev + 1, totalSlides - 1));
  const goPrev = () => setCurrentSlide(prev => Math.max(prev - 1, 0));

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, currentSlide]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[100vw] max-h-[100vh] w-screen h-screen p-0 border-0 rounded-none [&>button]:hidden">
        <div className="flex flex-col h-full bg-background">
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b bg-muted/30">
            <div className="flex items-center gap-4">
              <Presentation className="h-5 w-5 text-primary" />
              <span className="font-semibold">{project.name}</span>
              <span className="text-sm text-muted-foreground">
                — {slides[currentSlide]?.title}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* Slide indicators */}
              <div className="flex items-center gap-1.5">
                {slides.map((slide, idx) => (
                  <button
                    key={slide.id}
                    className={cn(
                      'w-2.5 h-2.5 rounded-full transition-colors',
                      idx === currentSlide
                        ? 'bg-primary'
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    )}
                    onClick={() => setCurrentSlide(idx)}
                    title={slide.title}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground ml-2">
                {currentSlide + 1}/{totalSlides}
              </span>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Slide content */}
          <div className="flex-1 overflow-hidden relative">
            <div className="h-full py-6">{slides[currentSlide]?.render()}</div>

            {/* Navigation arrows */}
            {currentSlide > 0 && (
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/80 border shadow-lg hover:bg-muted transition-colors"
                onClick={goPrev}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}
            {currentSlide < totalSlides - 1 && (
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/80 border shadow-lg hover:bg-muted transition-colors"
                onClick={goNext}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between px-6 py-2 border-t text-xs text-muted-foreground">
            <span>Use as setas do teclado para navegar</span>
            <span>
              COMPASS • {format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
