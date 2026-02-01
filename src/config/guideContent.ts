// CHG-04: Requirement examples for random display
export const REQUIREMENT_EXAMPLES = [
  "Garantir validação do usuário antes de concluir/encerrar entregas críticas.",
  "Assegurar critério de aceite explícito e verificável para a entrega final.",
  "Padronizar o processo com checklist mínimo aprovado e publicado.",
  "Disponibilizar evidência de execução registrada (print/log/auditoria) para cada entrega crítica.",
  "Garantir rastreabilidade ponta a ponta (registro único da solicitação até a conclusão).",
  "Manter indicador atualizado na frequência definida com baseline e meta registrados.",
  "Disponibilizar fonte única do dado (painel/relatório oficial) para evitar versões paralelas.",
  "Assegurar SLA mínimo de resposta e atualização visível para as partes envolvidas.",
  "Garantir canal único de comunicação por ocorrência/projeto (sem instruções paralelas).",
  "Padronizar nomenclaturas/status para eliminar ambiguidade de 'concluído' vs 'em validação'.",
  "Assegurar registro de decisões e mudanças de escopo (o que mudou e por quê).",
  "Garantir que o padrão seja treinável e replicável por qualquer pessoa habilitada.",
  "Manter rotina de checagem definida (semanal/quinzenal) com registro de resultados.",
  "Assegurar que exceções estejam definidas e tratadas com regra clara (quando fugir do padrão).",
  "Garantir conformidade com regras internas/externas aplicáveis (documentação e evidência)."
];

// CHG-04: Key questions to help write requirements
export const REQUIREMENT_QUESTIONS = [
  "Sem qual condição este projeto perde sentido?",
  "O que precisa ser verdade no final para dizer 'isso funciona'?",
  "O que não pode faltar, mesmo que todo o resto seja perfeito?",
  "Qual 'regra mínima' precisa existir para não voltar ao problema?",
  "Qual condição impede a volta do erro/retrabalho?",
  "O que precisa estar garantido para não depender de uma pessoa específica?",
  "Qual condição torna o processo replicável por qualquer um?",
  "Qual parte não pode ficar 'no improviso' de cada um?"
];

// CHG-07: Guide questions for "Situação Atual" (current situation diagnosis)
export const CURRENT_SITUATION_QUESTIONS = [
  "O que está acontecendo hoje, exatamente?",
  "Onde isso acontece (área/etapa/processo/canal)?",
  "Quando acontece (frequência: todo dia/semana/mês)?",
  "Com quem acontece (time/cliente/perfil/situação)?",
  "Qual é o sintoma mais visível do problema?",
  "Qual é o erro/retrabalho que mais se repete?",
  "O que gera variação (por que às vezes dá certo e às vezes dá errado)?",
  "Em quais etapas o problema aparece primeiro?",
  "Qual é o 'ponto de travamento' mais comum?",
  "O que hoje depende de esforço manual/'herói' para funcionar?",
  "Que parte está sem padrão (cada um faz de um jeito)?",
  "O que está em desacordo (N-OK) — liste 3 itens objetivos.",
  "Qual é o impacto prático imediato (tempo perdido / atraso / retrabalho / ruído)?",
  "Qual evidência você consegue mostrar agora (print, foto, log, relatório)?",
  "Se você tivesse que explicar em 10 segundos, qual é a frase do problema?"
];

// CHG-09: Guide questions for "Situação Alvo" (target situation)
export const TARGET_SITUATION_QUESTIONS = [
  "Como fica quando estiver resolvido (em 1 frase)?",
  "O que exatamente vai mudar do jeito que é hoje?",
  "Qual número precisa melhorar (qual métrica representa o problema)?",
  "Qual é o valor de hoje (baseline)?",
  "Qual é o valor final esperado (alvo)?",
  "Qual é o prazo para atingir esse alvo?",
  "O alvo é realista para um ciclo curto (até ~90 dias)?",
  "Qual é o limite mínimo aceitável (se não bater 100%)?",
  "O alvo elimina quais N-OK da situação atual (liste 1:1)?",
  "O que deve parar de acontecer totalmente?",
  "O que deve passar a acontecer sempre?",
  "O alvo precisa reduzir variação? Qual faixa aceitável?",
  "Qual 'regra do jogo' deixa claro que está atingido?",
  "Como você vai perceber na prática (efeito visível no dia a dia)?",
  "Se tivesse que escrever em 10 palavras, qual é o alvo?"
];

/**
 * Returns a random subset of items from the array.
 * Ensures consecutive calls don't return the exact same set.
 */
let lastRandomSeed = 0;
export function getRandomSubset<T>(items: T[], count: number): T[] {
  const shuffled = [...items];
  // Use a different seed each call
  const seed = Date.now() + lastRandomSeed++;
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(((seed * (i + 1) * 9301 + 49297) % 233280) / 233280 * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, items.length));
}
