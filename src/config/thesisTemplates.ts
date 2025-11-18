export interface ThesisTemplate {
  name: string;
  icon: string;
  color: string;
  defaultFields: Array<{
    key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select';
    options?: string[];
  }>;
  defaultKPIs: Array<{
    name: string;
    unit: string;
  }>;
}

export const THESIS_TEMPLATES: Record<string, ThesisTemplate> = {
  operational_efficiency: {
    name: 'Eficiência Operacional',
    icon: '⚙️',
    color: 'hsl(var(--chart-1))',
    defaultFields: [
      { 
        key: 'cost_reduction_target', 
        label: 'Meta de Redução de Custo (%)', 
        type: 'number' 
      },
      { 
        key: 'affected_area', 
        label: 'Área Afetada', 
        type: 'text' 
      },
      { 
        key: 'process_type', 
        label: 'Tipo de Processo', 
        type: 'select', 
        options: ['Logística', 'Produção', 'Administrativo', 'Comercial', 'Financeiro'] 
      }
    ],
    defaultKPIs: [
      { name: 'Redução de Custo', unit: '%' },
      { name: 'Tempo de Ciclo', unit: 'dias' },
      { name: 'Produtividade', unit: '%' }
    ]
  },
  sales_expansion: {
    name: 'Expansão de Vendas',
    icon: '📈',
    color: 'hsl(var(--chart-2))',
    defaultFields: [
      { 
        key: 'target_region', 
        label: 'Região Alvo', 
        type: 'text' 
      },
      { 
        key: 'growth_target', 
        label: 'Meta de Crescimento (%)', 
        type: 'number' 
      },
      { 
        key: 'channels', 
        label: 'Canais', 
        type: 'select', 
        options: ['Digital', 'Varejo', 'Atacado', 'Exportação', 'E-commerce'] 
      }
    ],
    defaultKPIs: [
      { name: 'Crescimento de Receita', unit: '%' },
      { name: 'Novos Clientes', unit: 'clientes' },
      { name: 'Market Share', unit: '%' }
    ]
  },
  new_business: {
    name: 'Novos Negócios',
    icon: '🚀',
    color: 'hsl(var(--chart-3))',
    defaultFields: [
      { 
        key: 'market_type', 
        label: 'Tipo de Mercado', 
        type: 'text' 
      },
      { 
        key: 'investment_range', 
        label: 'Faixa de Investimento', 
        type: 'select', 
        options: ['Baixo (<100k)', 'Médio (100k-500k)', 'Alto (>500k)'] 
      }
    ],
    defaultKPIs: [
      { name: 'Time to Market', unit: 'meses' },
      { name: 'ROI Esperado', unit: '%' },
      { name: 'Receita Projetada', unit: 'R$' }
    ]
  },
  custom: {
    name: 'Personalizada',
    icon: '✨',
    color: 'hsl(var(--muted-foreground))',
    defaultFields: [],
    defaultKPIs: []
  }
};

export const THESIS_TYPE_COLORS: Record<string, string> = {
  operational_efficiency: 'hsl(var(--chart-1))',
  sales_expansion: 'hsl(var(--chart-2))',
  new_business: 'hsl(var(--chart-3))',
  custom: 'hsl(var(--muted-foreground))'
};
