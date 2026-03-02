import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://drtxejwrlyoxobvkcqrt.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRydHhlandybHlveG9idmtjcXJ0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk4NDQwOSwiZXhwIjoyMDg1NTYwNDA5fQ.oKAnjCjg2l6zYZRVmOlJLJIauYSj81lTTNV_a-SigyM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  // Get first available user as creator/leader
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .limit(5);

  if (profileError || !profiles?.length) {
    console.error('No profiles found:', profileError);
    process.exit(1);
  }

  console.log('Available profiles:', profiles.map(p => `${p.full_name} (${p.id})`));

  const leader = profiles[0];
  const members = profiles.slice(1, 3);

  console.log(`\nUsing leader: ${leader.full_name}`);
  console.log(`Members: ${members.map(m => m.full_name).join(', ')}`);

  // Create project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      name: 'Otimização do Processo de Expedição',
      description: 'Projeto para otimizar o fluxo de expedição, reduzindo o tempo de processamento de pedidos e aumentando a taxa de entrega no prazo.',
      objective: 'Reduzir o tempo médio de expedição de 48h para 24h e aumentar a taxa de entrega no prazo de 78% para 95% em 90 dias.',
      status: 'approved',
      strategic_pillar: 'operational_efficiency',
      category: 'operacoes',
      created_by: leader.id,
      assigned_to: leader.id,
      is_critical: true,
      current_situation_description: 'O processo atual de expedição leva em média 48 horas desde a confirmação do pedido até a entrega ao transportador. A taxa de entrega no prazo é de apenas 78%, gerando reclamações de clientes e perda de vendas recorrentes. O gargalo principal está na separação manual de pedidos e na falta de integração entre o sistema de estoque e a plataforma logística.',
      target_situation_description: 'Com a automação da separação de pedidos via leitura de código de barras e integração direta entre ERP e transportadora, o tempo de expedição será reduzido para 24h. A meta é atingir 95% de entregas no prazo, com dashboard de acompanhamento em tempo real e alertas automáticos para desvios.',
    })
    .select()
    .single();

  if (projectError) {
    console.error('Error creating project:', projectError);
    process.exit(1);
  }

  console.log(`\nProject created: ${project.id}`);

  // Add team members
  for (const member of members) {
    await supabase.from('project_members').insert({
      project_id: project.id,
      user_id: member.id,
      added_by: leader.id,
    });
  }
  console.log('Team members added');

  // Create requirements
  const requirements = [
    { code: 'REQ-01', description: 'Tempo de separação de pedido < 30 min', indicator_name: 'Tempo separação', unit: 'min', current_value: 90, target_value: 30 },
    { code: 'REQ-02', description: 'Taxa de entrega no prazo >= 95%', indicator_name: 'Entrega no prazo', unit: '%', current_value: 78, target_value: 95 },
    { code: 'REQ-03', description: 'Integração ERP-Transportadora operacional', indicator_name: 'Integração', unit: '%', current_value: 0, target_value: 100 },
  ];

  for (const req of requirements) {
    await supabase.from('project_requirements').insert({
      project_id: project.id,
      ...req,
      display_order: requirements.indexOf(req),
    });
  }
  console.log('Requirements created');

  // Create indicators
  const indicators = [
    { name: 'Tempo Médio de Expedição', unit: 'horas', current_state: '48', target_state: '24' },
    { name: 'Taxa de Entrega no Prazo', unit: '%', current_state: '78', target_state: '95' },
    { name: 'Pedidos Processados/Dia', unit: 'pedidos', current_state: '120', target_state: '200' },
  ];

  for (const ind of indicators) {
    await supabase.from('project_indicators').insert({
      project_id: project.id,
      ...ind,
      is_active: true,
    });
  }
  console.log('Indicators created');

  // Create milestones
  const milestones = [
    { title: 'Decolagem', description: 'Setup inicial e diagnóstico completo', target_date: '2026-03-15', completed: true, completed_at: '2026-03-10T00:00:00Z', milestone_type: 'decolagem' },
    { title: 'Voo', description: 'Automação implantada e em testes', target_date: '2026-04-15', completed: false, milestone_type: 'voo' },
    { title: 'Escala', description: 'Processo 100% automatizado e estável', target_date: '2026-05-15', completed: false, milestone_type: 'escala' },
  ];

  const milestoneIds = [];
  for (const ms of milestones) {
    const { data } = await supabase.from('project_milestones').insert({
      project_id: project.id,
      ...ms,
    }).select().single();
    if (data) milestoneIds.push(data.id);
  }
  console.log('Milestones created');

  // Create tasks/actions
  const tasks = [
    { title: 'Mapear fluxo atual de expedição', status: 'completed', priority: 'high', milestone_id: milestoneIds[0], assigned_to: leader.id },
    { title: 'Instalar leitores de código de barras nas estações', status: 'completed', priority: 'high', milestone_id: milestoneIds[0], assigned_to: members[0]?.id || leader.id },
    { title: 'Configurar integração ERP-Transportadora', status: 'in_progress', priority: 'high', milestone_id: milestoneIds[1], assigned_to: members[1]?.id || leader.id },
    { title: 'Treinar equipe no novo processo', status: 'not_started', priority: 'medium', milestone_id: milestoneIds[1], assigned_to: leader.id },
    { title: 'Implementar dashboard de acompanhamento', status: 'not_started', priority: 'medium', milestone_id: milestoneIds[1], assigned_to: members[0]?.id || leader.id },
    { title: 'Teste piloto com 50 pedidos/dia', status: 'not_started', priority: 'high', milestone_id: milestoneIds[1], assigned_to: leader.id },
    { title: 'Rollout completo para toda operação', status: 'not_started', priority: 'high', milestone_id: milestoneIds[2], assigned_to: leader.id },
    { title: 'Configurar alertas automáticos de desvio', status: 'not_started', priority: 'low', milestone_id: milestoneIds[2], assigned_to: members[1]?.id || leader.id },
  ];

  for (const task of tasks) {
    await supabase.from('project_tasks').insert({
      project_id: project.id,
      created_by: leader.id,
      due_date: '2026-04-30',
      ...task,
    });
  }
  console.log('Tasks created');

  // Create fake image attachments (using placeholder paths — won't render actual images but will show structure)
  // In a real scenario these would be uploaded to the storage bucket
  // For now, creating DB records to show the mosaic UI rendering

  console.log('\n=== DONE ===');
  console.log(`Project ID: ${project.id}`);
  console.log(`URL: http://localhost:8080/execution/${project.id}`);
  console.log('\nNote: Para ver as imagens no mosaico, faça upload de imagens via wizard (Steps 3 e 4).');
  console.log('O projeto já está criado com todos os dados de contexto, requisitos, indicadores, milestones e ações.');
}

main().catch(console.error);
