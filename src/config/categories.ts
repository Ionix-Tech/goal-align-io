import { Zap, Shield, User, TrendingUp, Users } from 'lucide-react';

export const PROJECT_CATEGORIES = [
  { 
    value: 'productivity', 
    label: 'Produtividade', 
    icon: Zap,
    colorClass: 'bg-blue-100 text-blue-700 border-blue-300'
  },
  { 
    value: 'safety', 
    label: 'Segurança', 
    icon: Shield,
    colorClass: 'bg-red-100 text-red-700 border-red-300'
  },
  { 
    value: 'customer', 
    label: 'Cliente', 
    icon: User,
    colorClass: 'bg-green-100 text-green-700 border-green-300'
  },
  { 
    value: 'market', 
    label: 'Mercado', 
    icon: TrendingUp,
    colorClass: 'bg-orange-100 text-orange-700 border-orange-300'
  },
  { 
    value: 'culture_team', 
    label: 'Cultura & Equipe', 
    icon: Users,
    colorClass: 'bg-purple-100 text-purple-700 border-purple-300'
  },
] as const;

export type ProjectCategory = typeof PROJECT_CATEGORIES[number]['value'];

export const getCategoryConfig = (category: string | null | undefined) => {
  return PROJECT_CATEGORIES.find(c => c.value === category) || null;
};
