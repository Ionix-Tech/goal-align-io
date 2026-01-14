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
  | "improve_action"
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
  1: `**O que é o Contexto?**
O contexto define o "porquê" do projeto. Um bom objetivo responde: qual problema resolve e qual resultado espera?

💡 Pergunte-se: "Se eu não fizer este projeto, o que acontece?"`,

  2: `**O que são Requisitos?**
Requisitos são critérios de sucesso — o que PRECISA dar certo para o projeto ter êxito. Não são tarefas.

💡 Pergunte-se: "Como vou saber que este projeto foi bem-sucedido?"`,

  3: `**O que é a Situação Atual?**
Descreva onde você está HOJE com dados e fatos. Evite achismos — use evidências.

💡 Pergunte-se: "Se alguém de fora olhasse, o que veria?"`,

  4: `**O que é a Situação Alvo?**
O futuro desejado. Deve ser específico e mensurável, conectado aos requisitos.

💡 Pergunte-se: "Como será o dia seguinte quando este projeto terminar?"`,

  5: `**O que é o Plano de Ação?**
Ações concretas para sair do HOJE e chegar no ALVO. Cada ação deve atacar pelo menos um requisito.

💡 Pergunte-se: "Qual a PRIMEIRA coisa que preciso fazer amanhã?"`,

  6: `**O que é o Controle?**
Como você vai acompanhar o progresso? Defina indicadores e marcos de verificação.

💡 Pergunte-se: "Como vou saber se estou no caminho certo antes de terminar?"`,

  7: `**Revisão Final**
Releia o A3 de cima a baixo. Ele conta uma história lógica do problema à solução?

💡 Pergunte-se: "Uma pessoa que nunca viu isso entenderia em 5 minutos?"`
};

const systemPrompt = `Você é um assistente CONCISO para projetos A3.

REGRAS:
1. Respostas CURTAS - máximo 3-4 frases
2. Use exemplos de 1 linha quando necessário
3. NUNCA gere listas longas ou múltiplos parágrafos
4. Siga EXATAMENTE o formato solicitado em cada prompt

Respostas em português brasileiro. Direto ao ponto.`;

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
        userPrompt = `Step ${currentStep} do A3.

${stepGuidance[currentStep] || ''}

Dados do projeto:
- Nome: ${projectData.name || "(não definido)"}
- Objetivo: ${projectData.objective || "(não definido)"}

INSTRUÇÕES:
- Responda em NO MÁXIMO 4 linhas
- Comece explicando o conceito do step em 1 frase
- Termine com 1-2 perguntas reflexivas para o usuário
- NÃO dê respostas prontas, ajude o usuário a PENSAR`;
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

REESCREVA em NO MÁXIMO 2 FRASES no formato:
[VERBO] + [O QUE] + [PARA QUEM/ONDE] + [RESULTADO]

Ex: "Automatizar relatórios mensais para reduzir tempo de 5 dias para 4 horas."

NÃO inclua critérios, requisitos ou detalhes. Apenas o objetivo direto.`;
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
        userPrompt = `Objetivo: ${projectData.objective}

Gere 3 requisitos (1 frase cada).
Formato: "O [algo] deve [resultado mensurável]"
Ex: "O tempo de geração deve cair de 5 dias para 4 horas"

NÃO repita: ${JSON.stringify(projectData.requirements?.map((r: any) => r.description) || [])}`;
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
        userPrompt = `Requisito: "${specificInput}"

Reescreva em 1 FRASE com métrica.
Formato: "[Sujeito] deve [ação] [meta numérica]"
Ex: "Taxa de erro deve ser menor que 2%"`;
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

      case "improve_action":
        userPrompt = `Ação: "${specificInput}"

Reescreva em NO MÁXIMO 15 palavras.
Formato: [VERBO] + [O QUE] + [RESULTADO]
Ex: "Implementar dashboard automático para eliminar geração manual"`;
        toolDefinition = {
          type: "function",
          function: {
            name: "improved_action",
            description: "Retorna ação melhorada",
            parameters: {
              type: "object",
              properties: {
                improvedText: { type: "string" }
              },
              required: ["improvedText"]
            }
          }
        };
        toolChoice = { type: "function", function: { name: "improved_action" } };
        break;

      case "expand_current_situation":
        userPrompt = `Situação atual: ${projectData.currentSituationDescription || specificInput || ''}

Reescreva em NO MÁXIMO 4 frases:
1. Estado atual (1 frase)
2. Principal problema (1 frase)
3. Impacto quantificado (1 frase)
4. Evidência/dado (1 frase)

Direto. Sem introduções.`;
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
        userPrompt = `Situação atual: ${projectData.currentSituationDescription}
Requisitos: ${JSON.stringify(projectData.requirements?.map((r: any) => r.description) || [])}

Descreva situação ALVO em NO MÁXIMO 4 frases:
1. Estado futuro (1 frase)
2. Meta para requisitos (1-2 frases)
3. Benefício principal (1 frase)

Sem detalhes de implementação. Apenas resultado final.`;
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
        userPrompt = `Requisitos: ${JSON.stringify(projectData.requirements?.map((r: any) => r.code) || [])}

Sugira 3-5 ações (máximo 15 palavras cada).
Formato: VERBO + O QUE + RESULTADO
Ex: "Implementar dashboard automático para eliminar geração manual"

Vincule cada ação a requisito (R1, R2, etc.)`;
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
                      linkedRequirements: { type: "array", items: { type: "string" } },
                      priority: { type: "string", enum: ["high", "medium", "low"] },
                      estimatedHours: { type: "number" }
                    },
                    required: ["description", "linkedRequirements", "priority", "estimatedHours"]
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
        userPrompt = `Requisitos: ${JSON.stringify(projectData.requirements?.map((r: any) => r.code + ': ' + r.description) || [])}

Sugira 1 indicador por requisito.
Formato: Nome curto (3-5 palavras) + Unidade
Ex: "Tempo de geração" / "horas"
Ex: "Taxa de erro" / "%"`;
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
        userPrompt = `Pergunta do usuário: ${specificInput}

Contexto: Projeto "${projectData.name || 'sem nome'}", Step ${currentStep}.

REGRAS DA RESPOSTA:
- Máximo 4 linhas
- Não dê a resposta pronta
- Faça perguntas que ajudem o usuário a descobrir sozinho
- Se explicar um conceito, dê 1 exemplo curto
- Termine com uma pergunta reflexiva`;
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
