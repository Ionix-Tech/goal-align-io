import { Building2, Users, FileText, TrendingUp, Factory, CheckCircle, Cog, Truck, ShoppingCart, Monitor, DollarSign } from 'lucide-react';

export const PROJECT_CATEGORIES = [
  { 
    value: 'diretoria', 
    label: 'Diretoria', 
    icon: Building2,
    colorClass: 'bg-slate-100 text-slate-700 border-slate-300'
  },
  { 
    value: 'gestao_pessoas', 
    label: 'Gestão de Pessoas', 
    icon: Users,
    colorClass: 'bg-purple-100 text-purple-700 border-purple-300'
  },
  { 
    value: 'administrativo', 
    label: 'Administrativo', 
    icon: FileText,
    colorClass: 'bg-gray-100 text-gray-700 border-gray-300'
  },
  { 
    value: 'comercial', 
    label: 'Comercial', 
    icon: TrendingUp,
    colorClass: 'bg-blue-100 text-blue-700 border-blue-300'
  },
  { 
    value: 'industrial', 
    label: 'Industrial', 
    icon: Factory,
    colorClass: 'bg-orange-100 text-orange-700 border-orange-300'
  },
  { 
    value: 'qualidade', 
    label: 'Qualidade', 
    icon: CheckCircle,
    colorClass: 'bg-green-100 text-green-700 border-green-300'
  },
  { 
    value: 'engenharia', 
    label: 'Engenharia', 
    icon: Cog,
    colorClass: 'bg-cyan-100 text-cyan-700 border-cyan-300'
  },
  { 
    value: 'logistica', 
    label: 'Logística', 
    icon: Truck,
    colorClass: 'bg-amber-100 text-amber-700 border-amber-300'
  },
  { 
    value: 'compras', 
    label: 'Compras', 
    icon: ShoppingCart,
    colorClass: 'bg-rose-100 text-rose-700 border-rose-300'
  },
  { 
    value: 'ti', 
    label: 'TI', 
    icon: Monitor,
    colorClass: 'bg-indigo-100 text-indigo-700 border-indigo-300'
  },
  { 
    value: 'financeiro', 
    label: 'Financeiro', 
    icon: DollarSign,
    colorClass: 'bg-emerald-100 text-emerald-700 border-emerald-300'
  },
] as const;

export type ProjectCategory = typeof PROJECT_CATEGORIES[number]['value'];

export const getCategoryConfig = (category: string | null | undefined) => {
  return PROJECT_CATEGORIES.find(c => c.value === category) || null;
};
