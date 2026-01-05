import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type CopilotAction = 
  | "get_guidance"
  | "suggest_name"
  | "expand_objective"
  | "generate_requirements"
  | "improve_requirement"
  | "expand_current_situation"
  | "generate_target_situation"
  | "suggest_actions"
  | "suggest_indicators"
  | "validate_step"
  | "ask_question";

interface CopilotRequest {
  action: CopilotAction;
  currentStep: number;
  projectData: any;
  specificInput?: string;
}

const stepGuidance: Record<number, string> = {
  1: `No Step 1 (Contexto), o usuário precisa definir:
- Nome claro e objetivo do projeto
- Objetivo estratégico que o projeto atende
- Categoria/área do projeto
- Líder responsável e equipe
- Vinculação com tese estratégica (OKR)

Dicas importantes:
- O nome deve ser curto mas descritivo
- O objetivo deve explicar o "porquê" do projeto
- A vinculação com OKR garante alinhamento estratégico`,

  2: `No Step 2 (Requisitos), o usuário define "O Que Precisa Dar Certo" para o projeto ter sucesso.

Requisitos são critérios de sucesso, não tarefas. Exemplos:
- "Reduzir tempo de ciclo de 10 para 5 dias"
- "Aumentar satisfação do cliente de 7 para 9"
- "Eliminar retrabalho em 90%"

Cada requisito deve ser:
- Mensurável (com indicador)
- Específico (sem ambiguidade)
- Relevante para o objetivo`,

  3: `No Step 3 (Situação Atual), o usuário descreve onde estamos hoje.

Elementos importantes:
- Descrição clara do estado atual
- Evidências e dados que suportam
- Problemas identificados
- Links de referência (relatórios, dashboards)

Dica: Use dados concretos, não apenas percepções.`,

  4: `No Step 4 (Situação Alvo), o usuário descreve onde queremos chegar.

A situação alvo deve:
- Ser alcançável dentro do prazo
- Ter metas quantificadas para cada requisito
- Estar alinhada com o objetivo
- Representar um estado futuro claro`,

  5: `No Step 5 (Plano de Ação), o usuário define as ações para alcançar a situação alvo.

Cada ação deve ter:
- Descrição clara do que fazer
- Responsável definido
- Datas de início e fim
- Vinculação com requisitos (qual requisito essa ação atende?)
- Vinculação com milestone (M1, M2 ou M3)`,

  6: `No Step 6 (Controle), o usuário define como acompanhar o progresso.

Elementos:
- Indicadores vinculados aos requisitos
- Datas dos milestones (M1, M2, M3)
- M1 (Decolagem): Primeiras entregas
- M2 (Voo): Entregas intermediárias
- M3 (Escala): Conclusão do projeto`,

  7: `No Step 7 (Revisão), o usuário revisa todo o A3 antes de submeter.

Verificações finais:
- Todos os campos preenchidos
- Requisitos têm indicadores
- Ações cobrem todos os requisitos
- Datas são realistas
- Qualidade geral do documento`
};

const systemPrompt = `Você é um especialista em metodologia A3 Thinking e atua como copiloto guiando usuários na criação de projetos A3 de excelência.

Seja conciso, prático e acionável nas suas respostas.
Use linguagem acessível, evitando jargões excessivos.
Sempre forneça exemplos quando possível.

Contexto dos Steps:
- Step 1 (Contexto): Nome, objetivo, vinculação estratégica, equipe
- Step 2 (Requisitos): O que precisa dar certo (1-15 itens mensuráveis)
- Step 3 (Situação Atual): Onde estamos, evidências, problemas
- Step 4 (Situação Alvo): Onde queremos chegar, metas quantificadas
- Step 5 (Plano de Ação): Ações vinculadas aos requisitos e milestones
- Step 6 (Controle): Indicadores e milestones de acompanhamento

Regras:
- Respostas em português brasileiro
- Máximo 3 parágrafos por resposta
- Sempre inclua sugestões acionáveis
- Se gerar conteúdo, retorne no formato estruturado solicitado`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, currentStep, projectData, specificInput }: CopilotRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let userPrompt = "";
    let toolDefinition: any = null;
    let toolChoice: any = null;

    switch (action) {
      case "get_guidance":
        userPrompt = `O usuário está no Step ${currentStep} do wizard A3.
        
Dados atuais do projeto:
${JSON.stringify(projectData, null, 2)}

Forneça orientação contextual para este step, considerando o que já foi preenchido.
${stepGuidance[currentStep] || ''}

Identifique campos vazios ou incompletos e sugira próximos passos.`;
        break;

      case "suggest_name":
        userPrompt = `Baseado no objetivo do projeto: "${projectData.objective || specificInput}"
        
Sugira 3 nomes curtos e descritivos para este projeto A3.
Os nomes devem ser claros, profissionais e refletir o objetivo.`;
        toolDefinition = {
          type: "function",
          function: {
            name: "suggest_names",
            description: "Retorna sugestões de nomes para o projeto",
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: { type: "string" },
                  description: "Lista de 3 sugestões de nomes"
                }
              },
              required: ["suggestions"]
            }
          }
        };
        toolChoice = { type: "function", function: { name: "suggest_names" } };
        break;

      case "expand_objective":
        userPrompt = `Objetivo atual: "${projectData.objective || specificInput}"
        
Expanda e melhore este objetivo, tornando-o mais claro, específico e alinhado com boas práticas de gestão de projetos.
Mantenha a essência mas torne mais completo.`;
        toolDefinition = {
          type: "function",
          function: {
            name: "expanded_objective",
            description: "Retorna objetivo expandido",
            parameters: {
              type: "object",
              properties: {
                expandedText: { type: "string", description: "Objetivo expandido e melhorado" }
              },
              required: ["expandedText"]
            }
          }
        };
        toolChoice = { type: "function", function: { name: "expanded_objective" } };
        break;

      case "generate_requirements":
        userPrompt = `Projeto: ${projectData.name}
Objetivo: ${projectData.objective}
Requisitos existentes: ${JSON.stringify(projectData.requirements || [])}

Gere 3-5 requisitos adicionais para este projeto.
Requisitos são "O Que Precisa Dar Certo" - critérios de sucesso mensuráveis.
Cada requisito deve ter uma descrição clara e ser diferente dos existentes.`;
        toolDefinition = {
          type: "function",
          function: {
            name: "generate_requirements",
            description: "Gera requisitos para o projeto",
            parameters: {
              type: "object",
              properties: {
                requirements: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      description: { type: "string" }
                    },
                    required: ["description"]
                  }
                }
              },
              required: ["requirements"]
            }
          }
        };
        toolChoice = { type: "function", function: { name: "generate_requirements" } };
        break;

      case "improve_requirement":
        userPrompt = `Requisito atual: "${specificInput}"
Contexto do projeto: ${projectData.objective}

Melhore a redação deste requisito, tornando-o mais específico e mensurável.`;
        toolDefinition = {
          type: "function",
          function: {
            name: "improved_requirement",
            description: "Retorna requisito melhorado",
            parameters: {
              type: "object",
              properties: {
                improvedText: { type: "string" }
              },
              required: ["improvedText"]
            }
          }
        };
        toolChoice = { type: "function", function: { name: "improved_requirement" } };
        break;

      case "expand_current_situation":
        userPrompt = `Projeto: ${projectData.name}
Objetivo: ${projectData.objective}
Requisitos: ${JSON.stringify(projectData.requirements?.map((r: any) => r.description) || [])}
Situação atual: ${projectData.currentSituationDescription || specificInput || ''}

Expanda a descrição da situação atual, estruturando em:
1. Estado atual
2. Principais problemas
3. Evidências/dados
4. Impactos`;
        toolDefinition = {
          type: "function",
          function: {
            name: "expanded_situation",
            description: "Retorna situação atual expandida",
            parameters: {
              type: "object",
              properties: {
                expandedText: { type: "string" }
              },
              required: ["expandedText"]
            }
          }
        };
        toolChoice = { type: "function", function: { name: "expanded_situation" } };
        break;

      case "generate_target_situation":
        userPrompt = `Projeto: ${projectData.name}
Objetivo: ${projectData.objective}
Requisitos: ${JSON.stringify(projectData.requirements?.map((r: any) => r.description) || [])}
Situação atual: ${projectData.currentSituationDescription}

Gere uma descrição da situação alvo que:
1. Endereça cada problema da situação atual
2. Define metas para cada requisito
3. Descreve o estado futuro desejado`;
        toolDefinition = {
          type: "function",
          function: {
            name: "target_situation",
            description: "Retorna situação alvo gerada",
            parameters: {
              type: "object",
              properties: {
                targetText: { type: "string" }
              },
              required: ["targetText"]
            }
          }
        };
        toolChoice = { type: "function", function: { name: "target_situation" } };
        break;

      case "suggest_actions":
        userPrompt = `Projeto: ${projectData.name}
Objetivo: ${projectData.objective}
Requisitos: ${JSON.stringify(projectData.requirements?.map((r: any) => ({ code: r.code, description: r.description })) || [])}
Ações existentes: ${JSON.stringify(projectData.actions?.map((a: any) => a.description) || [])}
Situação alvo: ${projectData.targetSituationDescription}

Sugira 3-5 ações para alcançar a situação alvo.
Cada ação deve:
- Ser específica e executável
- Estar vinculada a pelo menos um requisito (use os códigos R1, R2, etc.)
- Ter descrição clara do que fazer`;
        toolDefinition = {
          type: "function",
          function: {
            name: "suggest_actions",
            description: "Sugere ações para o projeto",
            parameters: {
              type: "object",
              properties: {
                actions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      description: { type: "string" },
                      linkedRequirements: { type: "array", items: { type: "string" } }
                    },
                    required: ["description", "linkedRequirements"]
                  }
                }
              },
              required: ["actions"]
            }
          }
        };
        toolChoice = { type: "function", function: { name: "suggest_actions" } };
        break;

      case "suggest_indicators":
        userPrompt = `Projeto: ${projectData.name}
Requisitos: ${JSON.stringify(projectData.requirements?.map((r: any) => ({ code: r.code, description: r.description })) || [])}
Indicadores existentes: ${JSON.stringify(projectData.indicators?.map((i: any) => i.name) || [])}

Sugira indicadores para acompanhar o progresso dos requisitos.
Cada indicador deve ter nome, unidade e estar vinculado a requisitos.`;
        toolDefinition = {
          type: "function",
          function: {
            name: "suggest_indicators",
            description: "Sugere indicadores",
            parameters: {
              type: "object",
              properties: {
                indicators: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      unit: { type: "string" },
                      linkedRequirements: { type: "array", items: { type: "string" } }
                    },
                    required: ["name", "unit", "linkedRequirements"]
                  }
                }
              },
              required: ["indicators"]
            }
          }
        };
        toolChoice = { type: "function", function: { name: "suggest_indicators" } };
        break;

      case "validate_step":
        userPrompt = `Valide os dados do Step ${currentStep} do projeto A3:

${JSON.stringify(projectData, null, 2)}

${stepGuidance[currentStep] || ''}

Identifique:
1. Campos obrigatórios vazios
2. Problemas de qualidade
3. Inconsistências
4. Sugestões de melhoria`;
        toolDefinition = {
          type: "function",
          function: {
            name: "validation_result",
            description: "Resultado da validação",
            parameters: {
              type: "object",
              properties: {
                isValid: { type: "boolean" },
                issues: { type: "array", items: { type: "string" } },
                warnings: { type: "array", items: { type: "string" } },
                suggestions: { type: "array", items: { type: "string" } }
              },
              required: ["isValid", "issues", "warnings", "suggestions"]
            }
          }
        };
        toolChoice = { type: "function", function: { name: "validation_result" } };
        break;

      case "ask_question":
        userPrompt = `Contexto do projeto A3:
Nome: ${projectData.name}
Objetivo: ${projectData.objective}
Step atual: ${currentStep}

Pergunta do usuário: ${specificInput}

IMPORTANTE: Responda de forma CONCISA e estruturada:
- Máximo 5 linhas ou 5 bullet points
- Foco na resposta direta, sem introduções longas
- Se precisar detalhar, use tópicos curtos
- Sempre relacione com a metodologia A3`;
        break;

      default:
        userPrompt = `Forneça orientação geral sobre metodologia A3 para o step ${currentStep}.`;
    }

    const requestBody: any = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    };

    if (toolDefinition) {
      requestBody.tools = [toolDefinition];
      requestBody.tool_choice = toolChoice;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const choice = aiResponse.choices?.[0];

    let result: any = {
      message: "",
      generatedContent: null
    };

    if (choice?.message?.tool_calls?.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      const functionArgs = JSON.parse(toolCall.function.arguments);
      result.generatedContent = functionArgs;
      result.message = "Conteúdo gerado com sucesso!";
    } else if (choice?.message?.content) {
      result.message = choice.message.content;
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Copilot error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
