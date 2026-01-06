# Plano: Evoluir Aba "Carga de Trabalho" na Pagina de Inteligencia

## Objetivo
Complementar a visao de carga de trabalho atual (distribuicao de tarefas por membro) com uma nova secao de **Lideranca de Projetos**, mostrando o status dos projetos sob responsabilidade de cada lider. Alem disso, melhorar a UX geral e adicionar recursos de IA.

---

## Diagnostico Atual

### O que ja existe:
1. **Cards de resumo**: Total de tarefas, sem responsavel, atrasadas, membros sobrecarregados
2. **Grafico de barras**: Distribuicao de tarefas por membro (top 10)
3. **Cards por membro**: Detalhes de tarefas por pessoa (a fazer, em progresso, concluidas, atrasadas)

### O que falta:
1. **Visao de lideranca de projetos**: Quais projetos cada pessoa lidera e como estao
2. **Navegacao entre visualizacoes**: Alternar entre "Tarefas" e "Projetos"
3. **AI Features**: Sugestoes inteligentes de redistribuicao de carga
4. **Filtros**: Por pilar estrategico, por status de saude

---

## Arquitetura Proposta

### Nova Estrutura de Componentes

```
WorkloadDashboard.tsx (atualizado)
├── WorkloadSummaryCards.tsx (novo - extrai cards de resumo)
├── WorkloadTabs.tsx (novo - alterna entre visoes)
│   ├── Tab "Tarefas" 
│   │   ├── WorkloadChart.tsx (existente)
│   │   └── WorkloadMemberCard.tsx (existente)
│   └── Tab "Projetos"
│       ├── ProjectLeadershipChart.tsx (novo)
│       └── ProjectLeaderCard.tsx (novo)
└── WorkloadAIInsights.tsx (novo - painel de sugestoes IA)
```

---

## Mudancas Detalhadas

### 1. Criar Hook `useProjectLeadershipData`

**Arquivo**: `src/hooks/useProjectLeadershipData.ts`

**Funcionalidade**:
- Buscar todos os projetos ativos (status: approved, review, draft)
- Agrupar por `assigned_to` (lider do projeto)
- Para cada lider calcular:
  - Total de projetos liderados
  - Projetos por status de saude (green, yellow, red)
  - Projetos sem status de saude
  - Projetos atrasados (milestones vencidos)
  - Progresso medio dos projetos

**Interface retornada**:
```typescript
interface ProjectLeader {
  leaderId: string;
  leaderName: string;
  email: string;
  totalProjects: number;
  healthy: number;      // green
  attention: number;    // yellow
  critical: number;     // red
  noStatus: number;
  overdueProjects: number;
  averageProgress: number;
  projects: Array<{
    id: string;
    name: string;
    health: 'green' | 'yellow' | 'red' | null;
    progress: number;
    overdueMillestones: number;
  }>;
}
```

---

### 2. Criar Componente `ProjectLeadershipChart`

**Arquivo**: `src/components/management/ProjectLeadershipChart.tsx`

**Design**:
- Grafico de barras empilhadas (como WorkloadChart)
- Eixo X: Nome do lider (primeiro nome)
- Barras empilhadas: Projetos por status de saude
  - Verde: Projetos saudaveis
  - Amarelo: Projetos com atencao
  - Vermelho: Projetos criticos
  - Cinza: Sem status

---

### 3. Criar Componente `ProjectLeaderCard`

**Arquivo**: `src/components/management/ProjectLeaderCard.tsx`

**Design similar ao WorkloadMemberCard**:
- Avatar do lider
- Nome e email
- Badge de status geral (baseado em % de projetos criticos)
- Grid de metricas:
  - Saudaveis | Atencao | Criticos | Sem Status
- Lista expansivel dos projetos (opcional)
- Barra de progresso medio

---

### 4. Atualizar `WorkloadDashboard`

**Arquivo**: `src/components/management/WorkloadDashboard.tsx`

**Mudancas**:
- Adicionar `Tabs` do Radix para alternar entre:
  - "Tarefas" (conteudo atual)
  - "Projetos" (nova visao de lideranca)
- Mover cards de resumo para componente separado
- Adicionar card de resumo de projetos quando na aba "Projetos"

**Cards de resumo da aba "Projetos"**:
- Total de projetos ativos
- Projetos criticos (saude vermelha)
- Projetos sem lider
- Lideres sobrecarregados (>3 projetos com problemas)

---

### 5. Adicionar AI Insights (Recurso de IA)

**Arquivo**: `src/components/management/WorkloadAIInsights.tsx`

**Funcionalidade**:
Usar a Lovable AI (via edge function existente `management-chat`) para gerar insights automaticos sobre:

1. **Analise de Sobrecarga**:
   - Identificar membros com carga desproporcional
   - Sugerir redistribuicao de tarefas

2. **Alertas de Risco**:
   - Projetos sem atualizacoes recentes
   - Lideres com muitos projetos criticos
   - Tarefas atrasadas concentradas em poucos membros

3. **Recomendacoes**:
   - "Joao tem 3 projetos criticos. Considere redistribuir o Projeto X para Maria."
   - "5 tarefas estao sem responsavel no Projeto ABC."

**UI**:
- Card colapsavel no topo ou lateral
- Icone de "sparkles" (IA)
- Botao "Analisar carga" que chama a AI
- Lista de insights com badges de prioridade

**Implementacao**:
- Criar nova action no edge function `management-chat` ou usar o existente com contexto de workload
- Passar dados agregados de carga e lideranca para a AI
- Exibir resposta formatada

---

### 6. Melhorias de UX

**Cards clicaveis**:
- Ao clicar em um membro/lider, expandir para ver detalhes ou navegar para filtro

**Filtros**:
- Adicionar filtro por pilar estrategico
- Adicionar filtro por status de saude

**Ordenacao**:
- Permitir ordenar por: mais tarefas, mais atrasados, mais projetos criticos

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/hooks/useProjectLeadershipData.ts` | Hook para buscar dados de lideranca de projetos |
| `src/components/management/ProjectLeadershipChart.tsx` | Grafico de projetos por lider |
| `src/components/management/ProjectLeaderCard.tsx` | Card individual de lider |
| `src/components/management/WorkloadAIInsights.tsx` | Painel de insights de IA |

## Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `src/components/management/WorkloadDashboard.tsx` | Adicionar tabs, integrar novos componentes |
| `src/hooks/useWorkloadData.ts` | Adicionar dados de projetos sem responsavel (opcional) |

---

## Fluxo de Dados

```
useProjectLeadershipData
    ├── Query: projects (status in approved, review, draft)
    ├── Query: project_health_status (ultimo por projeto)
    ├── Query: project_milestones (para calcular atrasos)
    └── Query: profiles (para nome do lider)

Resultado: Array<ProjectLeader> ordenado por projetos criticos desc
```

---

## AI Features Detalhadas

### Opcao 1: Usar edge function existente

O `management-chat` ja aceita contexto do tipo `management` e pode responder perguntas sobre carga de trabalho. Podemos:
1. Adicionar um botao "Pedir analise para IA"
2. Montar contexto com dados de workload + leadership
3. Enviar pergunta pre-definida como "Analise a distribuicao de carga e sugira melhorias"

### Opcao 2: Criar insights automaticos

Criar logica client-side que identifica padroes e exibe cards de alerta:
- "3 membros estao sobrecarregados (>15 tarefas ativas)"
- "Ana lidera 4 projetos criticos - considere redistribuir"
- "15 tarefas estao sem responsavel"

**Recomendacao**: Comecar com Opcao 2 (simples, sem custo de AI) e adicionar botao para analise profunda via AI (Opcao 1)

---

## Beneficios

1. **Visao completa**: Tarefas E projetos em um so lugar
2. **Identificacao de gargalos**: Ver quem esta sobrecarregado tanto em tarefas quanto em projetos
3. **Decisoes informadas**: AI sugere redistribuicao de forma inteligente
4. **Navegacao intuitiva**: Tabs claras para alternar entre perspectivas
5. **Alertas proativos**: Identificar problemas antes que se tornem criticos

---

## Ordem de Implementacao

1. Criar `useProjectLeadershipData` (base de dados)
2. Criar `ProjectLeaderCard` (UI basica)
3. Criar `ProjectLeadershipChart` (visualizacao)
4. Atualizar `WorkloadDashboard` com tabs
5. Criar `WorkloadAIInsights` (opcional, pode ser fase 2)
6. Adicionar filtros e ordenacao (opcional, pode ser fase 2)
