
# Plano: Corrigir Erros de Build e Adicionar Colunas de Configuração em Indicadores

## Diagnóstico dos Problemas

### 1. Erros de TypeScript Identificados

| Arquivo | Linha | Problema |
|---------|-------|----------|
| `useProjectDetails.ts` | 20, 31 | `thesis_id` duplicado na interface `ProjectDetails` |
| `ProjectExecution.tsx` | 13, 43 | Import duplicado de `useProjectTasks` |
| `ProjectExecution.tsx` | 245, 247 | Comparação inválida com `'action_plan'` (tipo não existe no enum) |
| `ProjectDetail.tsx` | 551 | Usando `content` ao invés de `comment` na inserção |

### 2. Erro de Deploy de Edge Functions

O erro `npm:openai@^4.52.5` vem do `jsr:@supabase/functions-js/edge-runtime.d.ts` - uma dependência interna do runtime. Isso é um problema transitório que se resolve com redeploy.

---

## Ações Corretivas

### Correção 1: useProjectDetails.ts
- Remover a linha 31 que contém `thesis_id: string | null;` duplicada (já existe na linha 20)

### Correção 2: ProjectExecution.tsx
- Remover a linha 43 que duplica o import `useProjectTasks`
- Corrigir as comparações nas linhas 245 e 247:
  - De: `project.initiative_type === 'action_plan'`
  - Para: `project.initiative_type === 'project'`
  - (O tipo `action_plan` foi normalizado para `project` no hook)

### Correção 3: ProjectDetail.tsx
- Linha 553: Trocar `content:` por `comment:` para alinhar com a estrutura da tabela `project_comments`

---

## Migration SQL Solicitada

Adicionar as colunas de configuração de exibição:

```sql
-- Adiciona colunas de configuração de exibição nos indicadores de projeto
ALTER TABLE project_indicators
  ADD COLUMN IF NOT EXISTS display_format text DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS ytd_mode text DEFAULT 'accumulated';

-- Adiciona as mesmas colunas na tabela de KPIs estratégicos
ALTER TABLE thesis_kpis
  ADD COLUMN IF NOT EXISTS display_format text DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS ytd_mode text DEFAULT 'accumulated';
```

**Significado das colunas:**

| Coluna | Valores | Descrição |
|--------|---------|-----------|
| `display_format` | `'percentage'` / `'absolute'` | Como exibir o KPI na visão mensal |
| `ytd_mode` | `'accumulated'` / `'average'` | Como calcular o YTD (acumulado total ou média) |

---

## Edge Functions

**Nota importante**: O Lovable **faz deploy automático** das edge functions quando você salva o código. Não é necessário CLI nem dashboard externo.

As edge functions mencionadas já existem no projeto:
- `suggest-project-name` - usa `OPENAI_API_KEY` diretamente via fetch (sem SDK)
- `seed-users` - usa `SUPABASE_SERVICE_ROLE_KEY` (já configurado)

---

## Resumo da Implementação

```text
┌─────────────────────────────────────────────────────────┐
│  FASE 1: Corrigir Erros de TypeScript                   │
├─────────────────────────────────────────────────────────┤
│  • useProjectDetails.ts - remover thesis_id duplicado   │
│  • ProjectExecution.tsx - remover import duplicado      │
│  • ProjectExecution.tsx - corrigir comparação de tipo   │
│  • ProjectDetail.tsx - usar 'comment' ao invés de       │
│    'content'                                            │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  FASE 2: Executar Migration SQL                         │
├─────────────────────────────────────────────────────────┤
│  • Adicionar display_format em project_indicators       │
│  • Adicionar ytd_mode em project_indicators             │
│  • Adicionar display_format em thesis_kpis              │
│  • Adicionar ytd_mode em thesis_kpis                    │
└─────────────────────────────────────────────────────────┘
```

---

## Detalhes Técnicos

### Arquivos a Modificar

1. **src/hooks/useProjectDetails.ts**
   - Linha 31: Deletar `thesis_id: string | null;`

2. **src/pages/ProjectExecution.tsx**
   - Linha 43: Deletar `import { useProjectTasks } from "@/hooks/useProjectTasks";`
   - Linha 245: Trocar `'action_plan'` por `'project'`
   - Linha 247: Trocar `'action_plan'` por `'project'`

3. **src/pages/ProjectDetail.tsx**
   - Linha 553: Trocar `content:` por `comment:`

4. **Nova Migration SQL**
   - Adicionar colunas `display_format` e `ytd_mode` nas tabelas `project_indicators` e `thesis_kpis`
