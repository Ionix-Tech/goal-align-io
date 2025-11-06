import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface A3ReportExporterProps {
  project: {
    id: string;
    name: string;
    context: string | null;
    objective: string | null;
    requirements: string | null;
    strategic_pillar: string | null;
    creator?: { full_name: string } | null;
    assignee?: { full_name: string } | null;
    approved_at: string | null;
    indicators: Array<{
      id: string;
      name: string;
      current_state: string;
      target_state: string;
    }>;
    milestones: Array<{
      id: string;
      title: string;
      target_date: string;
      completed: boolean | null;
      progress?: number | null;
    }>;
    members: Array<{
      user: { full_name: string };
    }>;
  };
  situations?: Array<{
    current_problem: string;
    target_goal: string;
    indicators?: Array<{
      name: string;
      current_value: number;
      target_value: number;
      unit: string | null;
    }>;
  }>;
  pillarLabel?: string;
}

export function A3ReportExporter({ project, situations = [], pillarLabel }: A3ReportExporterProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      // Criar elemento temporário
      const reportElement = document.createElement('div');
      reportElement.style.position = 'absolute';
      reportElement.style.left = '-9999px';
      reportElement.style.width = '420mm'; // A3 landscape
      reportElement.style.padding = '15mm';
      reportElement.style.backgroundColor = 'white';
      reportElement.style.fontFamily = 'Arial, sans-serif';
      
      reportElement.innerHTML = `
        <div style="color: #000;">
          <!-- Cabeçalho -->
          <div style="border-bottom: 3px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px;">
            <h1 style="font-size: 32px; margin: 0; color: #1e40af;">${project.name}</h1>
            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 16px;">Relatório A3 Executivo · ${pillarLabel || 'Não definido'}</p>
          </div>

          <!-- Grid: 2 colunas -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            
            <!-- TESE -->
            <div>
              <h2 style="font-size: 20px; color: #1e40af; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">
                📋 TESE DO PROJETO
              </h2>
              
              <div style="margin-bottom: 14px;">
                <h3 style="font-size: 14px; font-weight: bold; color: #475569; margin-bottom: 6px;">Contexto</h3>
                <p style="font-size: 12px; line-height: 1.5; color: #334155; margin: 0;">${project.context || 'Não definido'}</p>
              </div>
              
              <div style="margin-bottom: 14px;">
                <h3 style="font-size: 14px; font-weight: bold; color: #475569; margin-bottom: 6px;">Objetivo</h3>
                <p style="font-size: 12px; line-height: 1.5; color: #334155; margin: 0;">${project.objective || 'Não definido'}</p>
              </div>
              
              ${project.requirements ? `
              <div>
                <h3 style="font-size: 14px; font-weight: bold; color: #475569; margin-bottom: 6px;">Requisitos</h3>
                <p style="font-size: 11px; line-height: 1.5; color: #334155; margin: 0; white-space: pre-wrap;">${project.requirements}</p>
              </div>
              ` : ''}
            </div>

            <!-- SITUAÇÃO ATUAL VS ALVO -->
            <div>
              <h2 style="font-size: 20px; color: #1e40af; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">
                🎯 SITUAÇÃO ATUAL VS ALVO
              </h2>
              
              ${situations.map((sit, idx) => `
                <div style="margin-bottom: 12px; padding: 12px; background: #f8fafc; border-radius: 6px; border-left: 3px solid #3b82f6;">
                  <h4 style="font-size: 13px; font-weight: bold; color: #1e40af; margin-bottom: 8px;">Situação ${idx + 1}</h4>
                  
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px;">
                    <div>
                      <p style="font-size: 11px; font-weight: bold; color: #ef4444; margin-bottom: 4px;">❌ Atual</p>
                      <p style="font-size: 10px; color: #334155; margin: 0; line-height: 1.4;">${sit.current_problem || 'N/A'}</p>
                    </div>
                    <div>
                      <p style="font-size: 11px; font-weight: bold; color: #10b981; margin-bottom: 4px;">✅ Alvo</p>
                      <p style="font-size: 10px; color: #334155; margin: 0; line-height: 1.4;">${sit.target_goal || 'N/A'}</p>
                    </div>
                  </div>
                  
                  ${(sit.indicators && sit.indicators.length > 0) ? `
                    <div style="border-top: 1px solid #e2e8f0; padding-top: 6px;">
                      <p style="font-size: 10px; font-weight: bold; color: #475569; margin-bottom: 3px;">Indicadores:</p>
                      ${sit.indicators.map(ind => `
                        <div style="font-size: 9px; color: #64748b; margin-bottom: 2px;">
                          <span style="font-weight: bold;">${ind.name}:</span> 
                          ${ind.current_value} → ${ind.target_value} ${ind.unit || ''}
                        </div>
                      `).join('')}
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>

          <!-- PROGRESSO -->
          <div>
            <h2 style="font-size: 20px; color: #1e40af; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px;">
              📊 PROGRESSO E INDICADORES
            </h2>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <!-- Milestones -->
              <div>
                <h3 style="font-size: 16px; font-weight: bold; color: #475569; margin-bottom: 8px;">
                  🏁 Milestones (${project.milestones.filter(m => m.completed).length}/${project.milestones.length} concluídos)
                </h3>
                ${project.milestones.map(ms => `
                  <div style="display: flex; align-items: center; padding: 8px; background: ${ms.completed ? '#ecfdf5' : '#fef3c7'}; border-radius: 4px; margin-bottom: 6px;">
                    <span style="font-size: 18px; margin-right: 8px;">${ms.completed ? '✅' : '⏳'}</span>
                    <div style="flex: 1;">
                      <p style="font-size: 12px; font-weight: bold; color: #334155; margin: 0;">${ms.title}</p>
                      <p style="font-size: 10px; color: #64748b; margin: 2px 0 0 0;">
                        ${new Date(ms.target_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                `).join('')}
              </div>

              <!-- Indicadores -->
              <div>
                <h3 style="font-size: 16px; font-weight: bold; color: #475569; margin-bottom: 8px;">
                  📈 Indicadores de Desempenho
                </h3>
                ${project.indicators.map(ind => `
                  <div style="padding: 10px; background: #f1f5f9; border-radius: 4px; margin-bottom: 8px; border-left: 3px solid #3b82f6;">
                    <p style="font-size: 12px; font-weight: bold; color: #334155; margin: 0 0 6px 0;">${ind.name}</p>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">
                      <div>
                        <span style="color: #64748b;">Atual:</span> 
                        <span style="font-weight: bold; color: #334155;">${ind.current_state}</span>
                      </div>
                      <div>
                        <span style="color: #64748b;">Meta:</span> 
                        <span style="font-weight: bold; color: #10b981;">${ind.target_state}</span>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Rodapé -->
          <div style="margin-top: 20px; padding-top: 12px; border-top: 2px solid #e2e8f0; font-size: 11px; color: #64748b;">
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
              <div><span style="font-weight: bold;">Criado por:</span> ${project.creator?.full_name || 'Desconhecido'}</div>
              <div><span style="font-weight: bold;">Responsável:</span> ${project.assignee?.full_name || 'Não atribuído'}</div>
              <div><span style="font-weight: bold;">Time:</span> ${project.members.length} membros</div>
            </div>
            <div style="text-align: center; margin-top: 10px; font-size: 10px;">
              Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(reportElement);
      
      // Capturar como imagem
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // Criar PDF A3 landscape
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a3'
      });
      
      const imgWidth = 420;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      
      // Salvar
      const fileName = `A3_${project.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      document.body.removeChild(reportElement);
      toast.success('Relatório A3 gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar relatório PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      variant="default"
      size="sm"
      onClick={generatePDF}
      disabled={isGenerating}
    >
      <Download className="mr-2 h-4 w-4" />
      {isGenerating ? 'Gerando PDF...' : 'Exportar Relatório A3'}
    </Button>
  );
}
