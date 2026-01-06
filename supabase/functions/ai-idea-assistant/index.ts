import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CATEGORIES = [
  { value: 'diretoria', label: 'Diretoria', description: 'Assuntos estratégicos de alto nível, decisões executivas, governança' },
  { value: 'gestao_pessoas', label: 'Gestão de Pessoas', description: 'RH, treinamento, cultura, desenvolvimento de equipe, contratações' },
  { value: 'administrativo_financas', label: 'Administrativo/Finanças', description: 'Contabilidade, finanças, controles internos, compliance' },
  { value: 'operacoes', label: 'Operações', description: 'Produção, manufatura, processos produtivos, chão de fábrica' },
  { value: 'logistica', label: 'Logística', description: 'Transporte, armazenagem, distribuição, supply chain' },
  { value: 'ti', label: 'Tecnologia da Informação', description: 'Sistemas, software, infraestrutura, automação digital' },
  { value: 'comercial', label: 'Comercial', description: 'Vendas, marketing, relacionamento com clientes, expansão de mercado' },
  { value: 'centro_inteligencia', label: 'Centro de Inteligência Freitas', description: 'Análise de dados, BI, insights estratégicos, pesquisa' },
  { value: 'business_design', label: 'Business Design', description: 'Inovação, novos modelos de negócio, design thinking, startups internas' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, title, description } = await req.json();
    
    console.log(`AI Idea Assistant - Action: ${action}, Title: ${title?.substring(0, 50)}`);

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Handle similar ideas detection - requires database access
    if (action === 'find_similar') {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      // Fetch existing ideas from the database
      const { data: existingIdeas, error: fetchError } = await supabase
        .from('projects')
        .select('id, name, description, status, initiative_type')
        .in('status', ['idea', 'draft', 'review', 'approved'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) {
        console.error('Error fetching existing ideas:', fetchError);
        throw new Error('Erro ao buscar ideias existentes');
      }

      if (!existingIdeas || existingIdeas.length === 0) {
        return new Response(
          JSON.stringify({ similar_ideas: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const systemPrompt = `Você é um especialista em análise de similaridade de ideias e projetos empresariais.
Sua tarefa é analisar uma NOVA IDEIA e comparar com ideias EXISTENTES para identificar possíveis duplicatas ou ideias relacionadas.

NOVA IDEIA:
Título: ${title}
Descrição: ${description}

IDEIAS EXISTENTES:
${existingIdeas.map((idea, i) => `${i + 1}. [ID: ${idea.id}] "${idea.name}" - ${idea.description?.substring(0, 150) || 'Sem descrição'}`).join('\n')}

ANÁLISE:
- Similaridade Alta (>70%): Ideias praticamente iguais ou com mesmo objetivo
- Similaridade Média (40-70%): Ideias relacionadas que poderiam ser combinadas
- Similaridade Baixa (<40%): Não considerar

Retorne APENAS ideias com similaridade média ou alta (>40%).
Se não houver ideias similares, retorne um array vazio.

Responda APENAS com um JSON válido no formato:
{
  "similar_ideas": [
    {
      "id": "uuid-da-ideia",
      "name": "nome da ideia",
      "similarity_score": 85,
      "reason": "Motivo da similaridade em 1 frase curta"
    }
  ]
}`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Analise a similaridade e retorne o JSON.' }
          ],
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI Gateway error:', response.status, errorText);
        
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: 'Limite de requisições atingido.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw new Error(`AI Gateway error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          // Validate and filter results
          const validSimilar = (parsed.similar_ideas || [])
            .filter((s: any) => s.id && existingIdeas.some(e => e.id === s.id))
            .slice(0, 3);
          
          return new Response(
            JSON.stringify({ similar_ideas: validSimilar }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (e) {
        console.error('Error parsing similar ideas JSON:', e);
      }

      return new Response(
        JSON.stringify({ similar_ideas: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle strategic alignment suggestion - requires database access
    if (action === 'suggest_strategic') {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      // Fetch active strategic theses
      const { data: theses, error: fetchError } = await supabase
        .from('strategic_theses')
        .select('id, name, description, objective, thesis_type')
        .eq('is_active', true)
        .eq('is_archived', false)
        .order('year', { ascending: false });

      if (fetchError) {
        console.error('Error fetching theses:', fetchError);
        throw new Error('Erro ao buscar objetivos estratégicos');
      }

      if (!theses || theses.length === 0) {
        return new Response(
          JSON.stringify({ suggestions: [], message: 'Nenhum objetivo estratégico ativo encontrado' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const systemPrompt = `Você é um especialista em alinhamento estratégico empresarial.
Sua tarefa é analisar uma NOVA IDEIA e sugerir qual(is) objetivo(s) estratégico(s) ela melhor se alinha.

NOVA IDEIA:
Título: ${title}
Descrição: ${description}

OBJETIVOS ESTRATÉGICOS ATIVOS:
${theses.map((t, i) => `${i + 1}. [ID: ${t.id}] "${t.name}"
   Tipo: ${t.thesis_type}
   Objetivo: ${t.objective}
   Descrição: ${t.description || 'N/A'}`).join('\n\n')}

ANÁLISE:
- Avalie o alinhamento da ideia com cada objetivo (0-100%)
- Considere: tema, área de impacto, objetivos, métricas potenciais
- Retorne apenas objetivos com alinhamento >= 50%

Responda APENAS com um JSON válido no formato:
{
  "suggestions": [
    {
      "thesis_id": "uuid-do-objetivo",
      "thesis_name": "nome do objetivo",
      "alignment_score": 85,
      "reason": "Explicação curta de por que a ideia se alinha a este objetivo"
    }
  ]
}`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Analise o alinhamento estratégico e retorne o JSON.' }
          ],
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI Gateway error:', response.status, errorText);
        
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: 'Limite de requisições atingido.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw new Error(`AI Gateway error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          // Validate and filter results
          const validSuggestions = (parsed.suggestions || [])
            .filter((s: any) => s.thesis_id && theses.some(t => t.id === s.thesis_id))
            .slice(0, 3);
          
          return new Response(
            JSON.stringify({ suggestions: validSuggestions }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (e) {
        console.error('Error parsing strategic suggestions JSON:', e);
      }

      return new Response(
        JSON.stringify({ suggestions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (action === 'categorize') {
      systemPrompt = `Você é um especialista em categorização de ideias empresariais. 
Analise o título e descrição da ideia e sugira a categoria mais apropriada.

Categorias disponíveis:
${CATEGORIES.map(c => `- ${c.value}: ${c.label} - ${c.description}`).join('\n')}

Responda APENAS com um JSON válido no formato:
{"category": "valor_da_categoria", "confidence": 0.85, "reason": "Explicação curta de por que essa categoria"}`;

      userPrompt = `Título: ${title}\nDescrição: ${description}`;
    } 
    else if (action === 'expand') {
      systemPrompt = `Você é um especialista em estruturação de ideias estratégicas empresariais.
Sua tarefa é expandir uma descrição curta de ideia em uma descrição mais completa e estruturada.

Mantenha a essência original, mas adicione:
1. Contexto: Por que isso é relevante agora
2. Problema/Oportunidade: O que se busca resolver ou aproveitar
3. Benefícios esperados: Quais resultados se espera obter

IMPORTANTE:
- Mantenha a linguagem profissional mas acessível
- Não invente informações específicas (números, datas)
- Máximo de 3-4 parágrafos
- Se a descrição original já for boa, apenas refine sem mudar muito`;

      userPrompt = `Título da ideia: ${title}\n\nDescrição original: ${description}\n\nExpanda esta descrição mantendo a essência original.`;
    }
    else if (action === 'evaluate') {
      systemPrompt = `Você é um especialista em avaliação de ideias e projetos estratégicos empresariais.
Sua tarefa é avaliar o IMPACTO potencial e o ESFORÇO necessário para implementar uma ideia.

ESCALA DE IMPACTO (1-5):
1 - Muito Baixo: Melhoria marginal, afeta poucos processos/pessoas
2 - Baixo: Melhoria pequena, benefício localizado
3 - Médio: Melhoria significativa, benefício para uma área inteira
4 - Alto: Grande impacto, benefício para múltiplas áreas ou receita
5 - Muito Alto: Transformacional, impacto estratégico em toda empresa

ESCALA DE ESFORÇO (1-5):
1 - Muito Baixo: Implementação simples, dias, poucos recursos
2 - Baixo: Algumas semanas, equipe pequena
3 - Médio: 1-3 meses, recursos moderados
4 - Alto: 3-6 meses, equipe dedicada, investimento significativo
5 - Muito Alto: 6+ meses, múltiplas equipes, alto investimento

IMPORTANTE:
- Seja realista e objetivo
- Considere o contexto de uma empresa de médio porte
- Justifique brevemente cada pontuação

Responda APENAS com um JSON válido no formato:
{
  "impact_score": 4,
  "effort_score": 2,
  "impact_reason": "Justificativa do impacto em 1 frase",
  "effort_reason": "Justificativa do esforço em 1 frase",
  "summary": "Resumo geral da avaliação em 2-3 frases"
}`;

      userPrompt = `Título: ${title}\nDescrição: ${description}`;
    }
    else {
      return new Response(
        JSON.stringify({ error: 'Ação não suportada' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições atingido. Tente novamente em alguns segundos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos de IA esgotados.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    console.log('AI Response:', content?.substring(0, 200));

    if (action === 'categorize') {
      // Parse JSON response
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return new Response(
            JSON.stringify(parsed),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (e) {
        console.error('Error parsing category JSON:', e);
      }
      
      // Fallback: try to find category in response
      const foundCategory = CATEGORIES.find(c => 
        content.toLowerCase().includes(c.value) || content.toLowerCase().includes(c.label.toLowerCase())
      );
      
      return new Response(
        JSON.stringify({ 
          category: foundCategory?.value || null, 
          confidence: 0.5,
          reason: 'Não foi possível determinar com certeza'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (action === 'expand') {
      return new Response(
        JSON.stringify({ expandedDescription: content }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'evaluate') {
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return new Response(
            JSON.stringify({
              impact_score: Math.min(5, Math.max(1, parseInt(parsed.impact_score) || 3)),
              effort_score: Math.min(5, Math.max(1, parseInt(parsed.effort_score) || 3)),
              impact_reason: parsed.impact_reason || '',
              effort_reason: parsed.effort_reason || '',
              summary: parsed.summary || ''
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (e) {
        console.error('Error parsing evaluation JSON:', e);
      }
      
      return new Response(
        JSON.stringify({ 
          impact_score: 3, 
          effort_score: 3,
          impact_reason: 'Não foi possível avaliar com precisão',
          effort_reason: 'Não foi possível avaliar com precisão',
          summary: 'Avaliação automática não disponível'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-idea-assistant:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
