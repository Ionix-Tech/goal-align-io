import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface A3ProjectData {
  name: string;
  objective: string;
  category: string;
  thesisId: string;
  strategicKpis: { kpiId: string; kpiName: string }[];
  requirements: { code: string; description: string; current_value?: number; target_value?: number; unit?: string }[];
  currentSituationDescription: string;
  targetSituationDescription: string;
  actions: { 
    description: string; 
    responsibleId: string; 
    dueDate: string; 
    linkedRequirements: string[];
    linkedIndicators: string[];
  }[];
  indicators: { name: string; currentValue: string; targetValue: string; unit: string; linkedRequirementCodes: string[] }[];
  m1Date: string;
  m2Date: string;
  m3Date: string;
  extraMilestones: { title: string; targetDate: string }[];
  whyLinks: { url: string; label: string }[];
}

const systemPrompt = `Você é um especialista em metodologia A3 Thinking e gestão de projetos estratégicos.

Analise o projeto A3 fornecido e avalie cada seção quanto a:
- Completude dos dados essenciais (nome, objetivo, requisitos, ações)
- Clareza e especificidade das descrições
- Coerência e alinhamento entre as seções
- Viabilidade das metas e prazos
- Vinculação adequada entre requisitos, indicadores e ações

IMPORTANTE: Este é um PLANEJAMENTO. NÃO penalize ausência de:
- Links externos ou evidências
- Documentação de suporte
- Resultados ou métricas (serão coletados na execução)

Foque em avaliar se o plano está bem estruturado para INICIAR a execução.
Seja específico nas recomendações, indicando exatamente o que precisa ser melhorado e como.
Considere um ciclo de 90 dias típico para projetos A3.`;

const analysisTool = {
  type: "function",
  function: {
    name: "analyze_a3_project",
    description: "Retorna uma análise estruturada do projeto A3 com scores, feedbacks e recomendações",
    parameters: {
      type: "object",
      properties: {
        overallScore: {
          type: "number",
          description: "Pontuação geral do projeto de 1 a 5"
        },
        summary: {
          type: "string",
          description: "Resumo executivo da análise em 2-3 frases"
        },
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Nome da seção (Contexto, Requisitos, Situação Atual, Situação Alvo, Plano de Ação, Indicadores, Milestones)" },
              status: { type: "string", enum: ["complete", "partial", "missing"], description: "Status de completude" },
              score: { type: "number", description: "Pontuação da seção de 1 a 5" },
              feedback: { type: "string", description: "Feedback específico sobre a seção" },
              suggestions: { type: "array", items: { type: "string" }, description: "Lista de sugestões de melhoria" }
            },
            required: ["name", "status", "score", "feedback", "suggestions"]
          }
        },
        recommendations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              priority: { type: "string", enum: ["high", "medium", "low"] },
              area: { type: "string", description: "Área afetada (ex: Requisitos, Ações)" },
              description: { type: "string", description: "Descrição do problema" },
              action: { type: "string", description: "Ação recomendada" }
            },
            required: ["priority", "area", "description", "action"]
          }
        },
        strengths: {
          type: "array",
          items: { type: "string" },
          description: "Lista de pontos fortes do projeto"
        },
        criticalGaps: {
          type: "array",
          items: { type: "string" },
          description: "Lista de gaps críticos que impedem aprovação"
        }
      },
      required: ["overallScore", "summary", "sections", "recommendations", "strengths", "criticalGaps"]
    }
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectData } = await req.json() as { projectData: A3ProjectData };
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing A3 project:", projectData.name);

    // Build the user prompt with project data
    const userPrompt = `Analise o seguinte projeto A3:

## Dados do Projeto

**Nome:** ${projectData.name || "Não definido"}
**Objetivo:** ${projectData.objective || "Não definido"}
**Categoria:** ${projectData.category || "Não definida"}
**Tese Estratégica:** ${projectData.thesisId ? "Vinculado" : "Não vinculado"}
**KPIs Estratégicos:** ${projectData.strategicKpis?.length > 0 ? projectData.strategicKpis.map(k => k.kpiName).join(", ") : "Nenhum"}

## Requisitos (${projectData.requirements?.filter(r => r.description).length || 0} definidos)
${projectData.requirements?.filter(r => r.description).map(r => 
  `- ${r.code}: ${r.description}${r.current_value != null ? ` (Atual: ${r.current_value}${r.unit || ''}, Meta: ${r.target_value}${r.unit || ''})` : ''}`
).join("\n") || "Nenhum requisito definido"}

## Situação Atual
${projectData.currentSituationDescription || "Não descrita"}

## Situação Alvo
${projectData.targetSituationDescription || "Não descrita"}

## Plano de Ação (${projectData.actions?.filter(a => a.description).length || 0} ações)
${projectData.actions?.filter(a => a.description).map(a => 
  `- ${a.description} (Responsável: ${a.responsibleId ? "Definido" : "Não definido"}, Prazo: ${a.dueDate || "Não definido"}, Requisitos: ${a.linkedRequirements?.join(", ") || "Nenhum"})`
).join("\n") || "Nenhuma ação definida"}

## Indicadores (${projectData.indicators?.length || 0} definidos)
${projectData.indicators?.map(i => 
  `- ${i.name}: ${i.currentValue}${i.unit} → ${i.targetValue}${i.unit} (Requisitos: ${i.linkedRequirementCodes?.join(", ") || "Nenhum"})`
).join("\n") || "Nenhum indicador definido"}

## Milestones
- M1 (Decolagem): ${projectData.m1Date || "Não definido"}
- M2 (Voo): ${projectData.m2Date || "Não definido"}
- M3 (Escala): ${projectData.m3Date || "Não definido"}
${projectData.extraMilestones?.filter(m => m.title).map(m => `- ${m.title}: ${m.targetDate || "Sem data"}`).join("\n") || ""}

Por favor, forneça uma análise detalhada usando a função analyze_a3_project.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [analysisTool],
        tool_choice: { type: "function", function: { name: "analyze_a3_project" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded. Please try again in a few seconds." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("AI Response received");

    // Extract tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "analyze_a3_project") {
      throw new Error("Invalid AI response format");
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    console.log("Analysis complete, score:", analysis.overallScore);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-a3 function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
