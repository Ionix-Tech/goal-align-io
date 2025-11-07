import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting test data population...');

    // Get first user
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single();

    if (profileError || !profiles) {
      throw new Error('No user profile found');
    }

    const userId = profiles.id;

    // STEP 1: Create approved project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: 'Redução de Retrabalho na Linha de Produção',
        status: 'approved',
        strategic_pillar: 'operational_efficiency',
        context: 'A linha de produção da fábrica de Curitiba apresenta alta taxa de retrabalho devido a falhas no processo de montagem. Isso gera custos adicionais de R$ 80.000/mês e atrasos nas entregas. Análise inicial indica que 70% dos problemas são causados por erros de setup e falta de padronização.',
        objective: 'Reduzir a taxa de retrabalho de 15% para menos de 3% em 6 meses, eliminando os principais pontos de falha identificados através da metodologia A3. Espera-se uma economia de R$ 60.000/mês e aumento de 20% na produtividade.',
        description: 'Implementar metodologia A3 para reduzir desperdícios e melhorar qualidade',
        requirements: 'Requisitos do projeto:\n- Implementar sistema poka-yoke em 5 estações críticas\n- Treinar 100% dos operadores em trabalho padronizado\n- Criar checklists de setup visual\n- Implementar sistema de gestão visual no gemba\n- Garantir sustentação através de auditorias semanais',
        created_by: userId,
        assigned_to: userId,
      })
      .select()
      .single();

    if (projectError) throw projectError;
    console.log('Project created:', project.id);

    // STEP 2: Create project situation
    const { data: situation, error: situationError } = await supabase
      .from('project_situations')
      .insert({
        project_id: project.id,
        current_problem: 'Alta taxa de retrabalho de 15% na linha de montagem, causando prejuízo de R$ 80.000/mês. Principais causas: erros de setup (45%), falta de padronização (30%), treinamento inadequado (25%).',
        target_goal: 'Reduzir taxa de retrabalho para menos de 3%, implementando poka-yokes, trabalho padronizado e treinamento completo da equipe. Meta: economia de R$ 60.000/mês.',
        display_order: 0,
        created_by: userId,
      })
      .select()
      .single();

    if (situationError) throw situationError;
    console.log('Situation created:', situation.id);

    // STEP 3: Create situation indicators
    await supabase.from('situation_indicators').insert([
      {
        situation_id: situation.id,
        name: 'Taxa de Retrabalho',
        current_value: 15.0,
        target_value: 3.0,
        unit: '%',
        display_order: 0,
      },
      {
        situation_id: situation.id,
        name: 'Custo de Retrabalho',
        current_value: 80000,
        target_value: 20000,
        unit: 'R$/mês',
        display_order: 1,
      },
      {
        situation_id: situation.id,
        name: 'Tempo de Setup',
        current_value: 45,
        target_value: 15,
        unit: 'min',
        display_order: 2,
      },
    ]);

    console.log('Situation indicators created');

    // STEP 4: Create milestones
    const currentDate = new Date();
    const { data: milestones } = await supabase
      .from('project_milestones')
      .insert([
        {
          project_id: project.id,
          title: 'Análise de Causa Raiz Completa',
          description: 'Realizar análise 5 Porquês e diagrama de Ishikawa para identificar causas fundamentais do retrabalho',
          target_date: new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          completed: true,
        },
        {
          project_id: project.id,
          title: 'Implementação de Poka-Yokes',
          description: 'Instalar dispositivos à prova de erros nas 5 estações críticas identificadas',
          target_date: new Date(currentDate.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          completed: true,
        },
        {
          project_id: project.id,
          title: 'Treinamento da Equipe',
          description: 'Treinar 100% dos operadores em trabalho padronizado e uso dos poka-yokes',
          target_date: new Date(currentDate.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          completed: false,
        },
        {
          project_id: project.id,
          title: 'Sistema de Gestão Visual',
          description: 'Implementar quadros de gestão visual e indicadores no gemba',
          target_date: new Date(currentDate.getTime() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          completed: false,
        },
        {
          project_id: project.id,
          title: 'Validação e Sustentação',
          description: 'Validar resultados e estabelecer rotina de auditorias para garantir sustentação',
          target_date: new Date(currentDate.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          completed: false,
        },
      ])
      .select();

    console.log('Milestones created');

    // STEP 5: Create project indicators
    await supabase.from('project_indicators').insert([
      {
        project_id: project.id,
        name: 'Taxa de Retrabalho',
        current_state: '15%',
        target_state: '3%',
        unit: '%',
      },
      {
        project_id: project.id,
        name: 'OEE (Overall Equipment Effectiveness)',
        current_state: '65%',
        target_state: '85%',
        unit: '%',
      },
      {
        project_id: project.id,
        name: 'Custo de Qualidade',
        current_state: 'R$ 80.000',
        target_state: 'R$ 20.000',
        unit: 'R$/mês',
      },
      {
        project_id: project.id,
        name: 'First Pass Yield',
        current_state: '85%',
        target_state: '97%',
        unit: '%',
      },
    ]);

    console.log('Project indicators created');

    // STEP 6: Create tasks
    await supabase.from('project_tasks').insert([
      {
        project_id: project.id,
        title: 'Realizar análise 5 Porquês',
        description: 'Conduzir análise de causa raiz com time de produção para identificar causas fundamentais',
        status: 'completed',
        priority: 'high',
        created_by: userId,
      },
      {
        project_id: project.id,
        title: 'Mapear estações críticas',
        description: 'Identificar as 5 estações com maior índice de retrabalho através de dados históricos',
        status: 'completed',
        priority: 'high',
        created_by: userId,
      },
      {
        project_id: project.id,
        title: 'Projetar dispositivos poka-yoke',
        description: 'Desenvolver 5 dispositivos à prova de erros customizados para as estações críticas',
        status: 'in_progress',
        priority: 'high',
        created_by: userId,
      },
      {
        project_id: project.id,
        title: 'Fabricar e instalar poka-yokes',
        description: 'Fabricar dispositivos e realizar instalação nas estações de produção',
        status: 'not_started',
        priority: 'medium',
        created_by: userId,
      },
      {
        project_id: project.id,
        title: 'Desenvolver material de treinamento',
        description: 'Criar apresentações, procedimentos operacionais e material visual para treinamento',
        status: 'in_progress',
        priority: 'high',
        created_by: userId,
      },
      {
        project_id: project.id,
        title: 'Executar treinamentos práticos',
        description: 'Realizar sessões hands-on com todos os operadores em 4 turmas',
        status: 'not_started',
        priority: 'high',
        created_by: userId,
      },
      {
        project_id: project.id,
        title: 'Implementar gestão visual',
        description: 'Criar quadros Andon, gráficos de indicadores e checklists visuais no gemba',
        status: 'not_started',
        priority: 'medium',
        created_by: userId,
      },
      {
        project_id: project.id,
        title: 'Estabelecer rotina de auditorias',
        description: 'Criar checklist e escala de auditorias semanais para garantir sustentação',
        status: 'not_started',
        priority: 'medium',
        created_by: userId,
      },
    ]);

    console.log('Tasks created');

    // STEP 7: Create health status
    await supabase.from('project_health_status').insert({
      project_id: project.id,
      health_status: 'amber',
      reason: 'Projeto avançando conforme planejado. Poka-yokes instalados com sucesso. Atenção necessária para conclusão dos treinamentos no prazo.',
      reported_by: userId,
    });

    console.log('Health status created');

    // STEP 8: Create milestone update
    if (milestones && milestones[0]) {
      await supabase.from('project_milestone_updates').insert({
        milestone_id: milestones[0].id,
        progress_percentage: 100,
        is_critical: false,
        notes: 'Análise concluída com sucesso. Identificadas 3 causas principais: erro de setup (45%), falta de trabalho padronizado (30%), e treinamento inadequado (25%). Plano de ação definido.',
        updated_by: userId,
      });

      console.log('Milestone update created');
    }

    // STEP 9: Create indicator measurements
    const { data: indicator } = await supabase
      .from('project_indicators')
      .select('id')
      .eq('project_id', project.id)
      .eq('name', 'Taxa de Retrabalho')
      .single();

    if (indicator) {
      await supabase.from('project_indicator_updates').insert([
        {
          indicator_id: indicator.id,
          measured_value: '12%',
          measurement_date: new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          progress_percentage: 25,
          notes: 'Primeira medição após implementação dos poka-yokes na estação 1 e 2',
          updated_by: userId,
        },
        {
          indicator_id: indicator.id,
          measured_value: '9%',
          measurement_date: new Date(currentDate.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          progress_percentage: 50,
          notes: 'Redução consistente após instalação de mais 2 poka-yokes e início dos treinamentos',
          updated_by: userId,
        },
        {
          indicator_id: indicator.id,
          measured_value: '7%',
          measurement_date: new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          progress_percentage: 67,
          notes: 'Progresso acelerado. Meta de 3% parece alcançável com conclusão dos treinamentos',
          updated_by: userId,
        },
      ]);

      console.log('Indicator updates created');
    }

    // STEP 10: Create weekly update
    await supabase.from('project_weekly_updates').insert({
      project_id: project.id,
      week_start_date: new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      week_end_date: new Date().toISOString().split('T')[0],
      health_status: 'amber',
      progress_summary: 'Semana produtiva com instalação de 4 dos 5 poka-yokes concluída. Taxa de retrabalho reduziu de 15% para 7% nas estações já implementadas. Treinamentos iniciados com primeira turma de 25 operadores.',
      challenges: 'Atraso de 3 dias na entrega do último dispositivo poka-yoke devido a problema com fornecedor. Necessário acelerar cronograma de treinamentos para compensar.',
      next_steps: 'Concluir instalação do 5º poka-yoke até sexta; Treinar 75 operadores restantes nas próximas 2 semanas; Iniciar implementação de gestão visual no gemba',
      submitted_by: userId,
    });

    console.log('Weekly update created');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Projeto de teste criado com sucesso!',
        projectId: project.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
