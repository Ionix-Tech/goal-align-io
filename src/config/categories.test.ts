import { describe, it, expect } from 'vitest';
import { PROJECT_CATEGORIES, getCategoryConfig } from './categories';

describe('PROJECT_CATEGORIES', () => {
  it('includes Marketing category', () => {
    const marketing = PROJECT_CATEGORIES.find(c => c.value === 'marketing');
    expect(marketing).toBeDefined();
    expect(marketing!.label).toBe('Marketing');
    expect(marketing!.colorClass).toContain('pink');
  });

  it('has all expected categories', () => {
    const values = PROJECT_CATEGORIES.map(c => c.value);
    expect(values).toContain('diretoria');
    expect(values).toContain('gestao_pessoas');
    expect(values).toContain('administrativo_financas');
    expect(values).toContain('operacoes');
    expect(values).toContain('logistica');
    expect(values).toContain('ti');
    expect(values).toContain('comercial');
    expect(values).toContain('centro_inteligencia');
    expect(values).toContain('marketing');
    expect(values).toContain('business_design');
  });

  it('has 10 categories total', () => {
    expect(PROJECT_CATEGORIES).toHaveLength(10);
  });

  it('every category has required fields', () => {
    for (const cat of PROJECT_CATEGORIES) {
      expect(cat.value).toBeTruthy();
      expect(cat.label).toBeTruthy();
      expect(cat.icon).toBeDefined();
      expect(cat.colorClass).toBeTruthy();
    }
  });

  it('has no duplicate values', () => {
    const values = PROJECT_CATEGORIES.map(c => c.value);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe('getCategoryConfig', () => {
  it('returns correct config for marketing', () => {
    const config = getCategoryConfig('marketing');
    expect(config).not.toBeNull();
    expect(config!.label).toBe('Marketing');
  });

  it('returns correct config for existing categories', () => {
    expect(getCategoryConfig('diretoria')!.label).toBe('Diretoria');
    expect(getCategoryConfig('comercial')!.label).toBe('Comercial');
    expect(getCategoryConfig('business_design')!.label).toBe('Business Design');
  });

  it('returns null for unknown category', () => {
    expect(getCategoryConfig('nonexistent')).toBeNull();
  });

  it('returns null for null input', () => {
    expect(getCategoryConfig(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(getCategoryConfig(undefined)).toBeNull();
  });
});
