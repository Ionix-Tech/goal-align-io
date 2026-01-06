import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

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
