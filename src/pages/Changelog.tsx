import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ChangelogEntry {
  version: string;
  date: string;
  changes: { type: 'fix' | 'feature' | 'improvement'; description: string }[];
}

const changelog: ChangelogEntry[] = [
  {
    version: "0.9.3",
    date: "2026-02-19",
    changes: [
      { type: 'fix', description: 'Indicador estratégico (KR) selecionado no Step 1 do Wizard agora persiste no Step 6 mesmo após recarregar a página' },
      { type: 'fix', description: 'Corrigido bug no Wizard A3: ações do plano de ação eram apagadas ao navegar entre passos (voltar/avançar)' },
      { type: 'fix', description: 'Corrigido queries sem filtro de projeto em requirement_task_links e task_indicator_links (carregava dados de todos os projetos)' },
      { type: 'fix', description: 'Prioridade das ações agora é salva corretamente (antes era sempre gravada como "medium")' },
      { type: 'fix', description: 'Removida duplicação de persistência de tasks/indicators no submit do wizard (double-write)' },
      { type: 'fix', description: 'Adicionada proteção contra auto-save e save manual rodando simultaneamente' },
    ],
  },
  {
    version: "0.9.1",
    date: "2026-02-17",
    changes: [
      { type: 'fix', description: 'Corrigido bug crítico: modo de edição do KPI persistia ao trocar de indicador, causando sobrescrita de dados' },
      { type: 'feature', description: 'Responsável do KPI agora pode ser alterado após criação (dropdown de membros da equipe)' },
      { type: 'feature', description: 'KPI com escolha de formato de exibição: valor absoluto (R$, número) ou percentual de atingimento' },
      { type: 'feature', description: 'YTD com opção de cálculo: acumulado ou média (ex: NPS usa média). Tooltip explicativo no grid' },
      { type: 'improvement', description: 'Unidade do KPI agora é dropdown fixo (R$, %, #) em vez de texto livre — todos os formulários de criação e edição' },
      { type: 'fix', description: 'Filtro de objetivos agora filtra pelo pilar selecionado (antes mostrava todos os objetivos independente do pilar)' },
      { type: 'fix', description: 'KPIs estratégicos agora aparecem na página de Objetivos (integração com novo sistema de KPIs). Contadores de KPIs e Projetos corrigidos nos cards' },
      { type: 'feature', description: 'Botão "olhinho" no grid de KPIs: expande linha com Meta vs Real de todos os meses sem precisar abrir o detalhe' },
      { type: 'improvement', description: 'Criação de KPI estratégico simplificada: basta selecionar o objetivo e o pilar é preenchido automaticamente' },
      { type: 'feature', description: 'Apresentação A3 em tela cheia: slides com capa, diagnóstico (situação atual vs alvo com imagens), indicadores, milestones e resumo executivo. Navegação por setas do teclado' },
    ],
  },
  {
    version: "0.9.0",
    date: "2026-02-12",
    changes: [
      { type: 'feature', description: 'Wizard A3 com melhorias de usabilidade' },
      { type: 'feature', description: 'Edição de KPIs no grid consolidado' },
      { type: 'feature', description: 'Kanban com exclusão de projetos' },
      { type: 'improvement', description: 'Busca de KPIs estratégicos a partir da tabela kpis' },
      { type: 'fix', description: 'Hook useKPIs corrigido para buscar apenas quando filtros são fornecidos' },
    ],
  },
];

const typeBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  fix: { label: 'Fix', variant: 'destructive' },
  feature: { label: 'Novo', variant: 'default' },
  improvement: { label: 'Melhoria', variant: 'secondary' },
};

export default function Changelog() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-1">Changelog</h1>
      <p className="text-muted-foreground mb-6">Histórico de atualizações do COMPASS</p>

      <div className="space-y-4">
        {changelog.map((entry) => (
          <Card key={entry.version}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">v{entry.version}</CardTitle>
                <span className="text-sm text-muted-foreground">{entry.date}</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {entry.changes.map((change, i) => {
                  const badge = typeBadge[change.type];
                  return (
                    <li key={i} className="flex items-start gap-2">
                      <Badge variant={badge.variant} className="text-xs mt-0.5 shrink-0">
                        {badge.label}
                      </Badge>
                      <span className="text-sm">{change.description}</span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
