import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { A3WizardProgress } from './A3WizardProgress';

describe('A3WizardProgress', () => {
  const defaultProps = {
    currentStep: 1,
    onStepClick: () => {},
    canNavigateTo: () => true,
  };

  it('renders step 3 as "Situação Atual" (not "Diagnóstico")', () => {
    render(<A3WizardProgress {...defaultProps} />);
    expect(screen.getByText('Situação Atual')).toBeInTheDocument();
    expect(screen.queryByText('Diagnóstico')).not.toBeInTheDocument();
  });

  it('renders step 4 as "Situação Alvo" (not "Estratégia")', () => {
    render(<A3WizardProgress {...defaultProps} />);
    expect(screen.getByText('Situação Alvo')).toBeInTheDocument();
    expect(screen.queryByText('Estratégia')).not.toBeInTheDocument();
  });

  it('renders all 7 step labels', () => {
    render(<A3WizardProgress {...defaultProps} />);
    expect(screen.getByText('Contexto')).toBeInTheDocument();
    expect(screen.getByText('Requisitos')).toBeInTheDocument();
    expect(screen.getByText('Situação Atual')).toBeInTheDocument();
    expect(screen.getByText('Situação Alvo')).toBeInTheDocument();
    expect(screen.getByText('Plano de Ação')).toBeInTheDocument();
    expect(screen.getByText('Controle')).toBeInTheDocument();
    expect(screen.getByText('Fechamento')).toBeInTheDocument();
  });

  it('renders sublabels for each step', () => {
    render(<A3WizardProgress {...defaultProps} />);
    expect(screen.getByText('O que é esse projeto?')).toBeInTheDocument();
    expect(screen.getByText('O que precisa dar certo?')).toBeInTheDocument();
    expect(screen.getByText('Onde estamos hoje?')).toBeInTheDocument();
    expect(screen.getByText('Onde queremos chegar?')).toBeInTheDocument();
    expect(screen.getByText('O que vamos fazer?')).toBeInTheDocument();
    expect(screen.getByText('Quando vamos verificar?')).toBeInTheDocument();
    expect(screen.getByText('Revisão final')).toBeInTheDocument();
  });
});
