import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { A3ReportData } from '@/hooks/useA3ReportData';

interface PrintableA3ReportProps {
  project: {
    name: string;
    strategic_pillar: string | null;
    context: string | null;
    objective: string | null;
    assignee: { full_name: string } | null;
    members: Array<{ user: { full_name: string } }>;
  };
  milestones: Array<{
    id: string;
    title: string;
    target_date: string;
    completed: boolean;
  }>;
  indicators: Array<{
    id: string;
    name: string;
    current_state: string;
    target_state: string;
    unit: string | null;
  }>;
  situations: Array<{
    current_problem: string;
    target_goal: string;
  }> | undefined;
  reportData: A3ReportData | null | undefined;
}

const strategicPillars: Record<string, { label: string; icon: string }> = {
  operational_efficiency: { label: 'Eficiência Operacional', icon: '⚙️' },
  sales_expansion: { label: 'Expansão de Vendas', icon: '📈' },
  new_business: { label: 'Novos Negócios', icon: '🚀' }
};

const healthStatusMap: Record<string, { label: string; icon: string }> = {
  green: { label: 'Verde', icon: '🟢' },
  amber: { label: 'Amarelo', icon: '🟡' },
  red: { label: 'Vermelho', icon: '🔴' }
};

export function PrintableA3Report({ 
  project, 
  milestones, 
  indicators, 
  situations,
  reportData 
}: PrintableA3ReportProps) {
  const pillarConfig = project.strategic_pillar 
    ? strategicPillars[project.strategic_pillar] 
    : null;

  const completedMilestones = milestones.filter(m => m.completed).length;
  const milestoneProgress = milestones.length > 0 
    ? Math.round((completedMilestones / milestones.length) * 100) 
    : 0;

  return (
    <div id="printable-a3-report" className="hidden print:block">
      {/* PÁGINA 1: Visão Geral */}
      <div className="print-page">
        {/* Header */}
        <div className="print-header">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
              <div className="flex gap-3 text-sm">
                {pillarConfig && (
                  <span>
                    <span className="mr-1">{pillarConfig.icon}</span>
                    <strong>Pilar:</strong> {pillarConfig.label}
                  </span>
                )}
                <span>
                  <strong>Data:</strong> {format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tese do Projeto - Compacta */}
        <div className="print-section">
          <h2 className="print-section-title">📋 TESE DO PROJETO</h2>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Contexto:</strong> {project.context?.substring(0, 200) || 'Sem contexto'}
              {project.context && project.context.length > 200 && '...'}
            </div>
            <div>
              <strong>Objetivo:</strong> {project.objective?.substring(0, 150) || 'Sem objetivo'}
              {project.objective && project.objective.length > 150 && '...'}
            </div>
          </div>
        </div>

        {/* Situações A3 */}
        {situations && situations.length > 0 && (
          <div className="print-section">
            <h2 className="print-section-title">🎯 SITUAÇÕES A3</h2>
            <table className="compact-table w-full">
              <thead>
                <tr>
                  <th className="text-left">Problema Atual</th>
                  <th className="text-left">Objetivo Alvo</th>
                </tr>
              </thead>
              <tbody>
                {situations.map((sit, idx) => (
                  <tr key={idx}>
                    <td className="text-sm">{sit.current_problem}</td>
                    <td className="text-sm">{sit.target_goal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Progresso */}
        <div className="print-section">
          <h2 className="print-section-title">📊 PROGRESSO</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex items-center justify-between mb-1">
                <strong>Milestones:</strong>
                <span>{milestoneProgress}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${milestoneProgress}%` }}></div>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {completedMilestones} de {milestones.length} concluídos
              </div>
            </div>
            <div>
              <strong>Indicadores:</strong> {indicators.length} em acompanhamento
            </div>
          </div>
        </div>
      </div>

      {/* PÁGINA 2: Atividades e Status Atual */}
      <div className="print-page page-break">
        {/* Resumo de Tarefas */}
        <div className="print-section">
          <h2 className="print-section-title">📋 RESUMO DE TAREFAS</h2>
          <div className="flex gap-4 text-sm mb-3">
            <span><strong>Total:</strong> {reportData?.taskSummary.total || 0}</span>
            <span>✅ {reportData?.taskSummary.completed || 0}</span>
            <span>⏳ {reportData?.taskSummary.inProgress || 0}</span>
            <span className="status-amber">⚠️ {reportData?.taskSummary.blocked || 0} bloqueadas</span>
            <span className="status-red">🔴 {reportData?.taskSummary.overdue || 0} atrasadas</span>
          </div>

          {/* Tarefas Críticas */}
          {reportData?.taskSummary.criticalTasks && reportData.taskSummary.criticalTasks.length > 0 && (
            <div className="mt-3">
              <h3 className="font-semibold text-sm mb-2">⚠️ TAREFAS CRÍTICAS (requerem atenção)</h3>
              <ul className="space-y-1 text-sm">
                {reportData.taskSummary.criticalTasks.slice(0, 5).map(task => (
                  <li key={task.id} className="flex justify-between">
                    <span>
                      • <strong>{task.title}</strong> - 
                      {task.status === 'blocked' ? ' Bloqueada' : ' Atrasada'} - 
                      Responsável: {task.assignee?.full_name || 'Não atribuído'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Últimas Atualizações */}
        <div className="print-section">
          <h2 className="print-section-title">📈 ÚLTIMAS ATIVIDADES</h2>
          
          {/* Milestones */}
          {reportData?.milestoneUpdates && reportData.milestoneUpdates.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-sm mb-2">Milestones (Top 3):</h3>
              <ul className="space-y-2 text-sm">
                {reportData.milestoneUpdates.map(update => (
                  <li key={update.id} className="border-l-2 border-gray-300 pl-2">
                    <div className="flex justify-between">
                      <strong>{update.milestone.title}</strong>
                      <span>
                        {update.progress_percentage}% 
                        {update.is_critical && <span className="status-amber ml-1">⚠️ Crítico</span>}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {format(new Date(update.updated_at), 'dd/MM/yyyy')} - {update.updater.full_name}
                    </div>
                    {update.notes && (
                      <div className="text-xs italic mt-1">"{update.notes.substring(0, 100)}{update.notes.length > 100 ? '...' : ''}"</div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Indicadores */}
          {reportData?.indicatorUpdates && reportData.indicatorUpdates.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-2">Indicadores (Top 3):</h3>
              <ul className="space-y-2 text-sm">
                {reportData.indicatorUpdates.map(update => (
                  <li key={update.id} className="border-l-2 border-gray-300 pl-2">
                    <div className="flex justify-between">
                      <strong>{update.indicator.name}</strong>
                      <span>
                        {update.measured_value}
                        {update.indicator.unit ? ` ${update.indicator.unit}` : ''} → 
                        {update.progress_percentage}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {format(new Date(update.measurement_date), 'dd/MM/yyyy')} - {update.updater.full_name}
                    </div>
                    {update.notes && (
                      <div className="text-xs italic mt-1">"{update.notes.substring(0, 100)}{update.notes.length > 100 ? '...' : ''}"</div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Último Weekly Update */}
        {reportData?.weeklyUpdate && (
          <div className="print-section">
            <h2 className="print-section-title">
              🗓️ ÚLTIMO UPDATE SEMANAL 
              ({format(new Date(reportData.weeklyUpdate.week_start_date), 'dd/MM')} - 
              {format(new Date(reportData.weeklyUpdate.week_end_date), 'dd/MM')})
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <strong>Status:</strong> 
                <span>
                  {healthStatusMap[reportData.weeklyUpdate.health_status]?.icon}{' '}
                  {healthStatusMap[reportData.weeklyUpdate.health_status]?.label}
                </span>
              </div>
              <div>
                <strong>Progresso:</strong> {reportData.weeklyUpdate.progress_summary}
              </div>
              {reportData.weeklyUpdate.challenges && (
                <div>
                  <strong>Desafios:</strong> {reportData.weeklyUpdate.challenges}
                </div>
              )}
              {reportData.weeklyUpdate.next_steps && (
                <div>
                  <strong>Próximos Passos:</strong> {reportData.weeklyUpdate.next_steps}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="print-footer">
          <div className="flex justify-between text-xs text-gray-600">
            <div>
              <strong>Gestor:</strong> {project.assignee?.full_name || 'Não atribuído'}
            </div>
            <div>
              <strong>Equipe:</strong> {project.members.length} membro{project.members.length !== 1 ? 's' : ''}
            </div>
            <div>
              <strong>Gerado em:</strong> {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
