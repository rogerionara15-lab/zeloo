
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION_CORE = `
Você é o Engenheiro Chefe da Zeloo, uma plataforma premium de manutenção residencial.
Seu conhecimento baseia-se em:
1. NORMAS TÉCNICAS (ABNT): Segurança elétrica e hidráulica.
2. ORÇAMENTAÇÃO (SINAPI): Valores referenciais da Caixa Econômica Federal para construção civil no Brasil.
3. ATENDIMENTO: Tom profissional, zeloso e técnico.

Ao gerar orçamentos: Liste itens de mão de obra e sugira materiais.
`;

export const getMaintenanceAdvice = async (issue: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `O usuário relatou o seguinte problema em casa: "${issue}". Analise tecnicamente e explique como a Zeloo resolve isso.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_CORE,
      },
    });
    return response.text;
  } catch (error) {
    console.error(error);
    return "Erro no diagnóstico. Tente novamente.";
  }
};

export const generateBudget = async (data: {
  serviceType: string;
  description: string;
  area: string;
  location: string;
  finishLevel: string;
}) => {
  try {
    const prompt = `
      GERAR ORÇAMENTO TÉCNICO REFERENCIAL (BASE SINAPI)
      SERVIÇO: ${data.serviceType}
      DETALHES: ${data.description}
      QUANTIDADE/ÁREA: ${data.area}
      PADRÃO: ${data.finishLevel}

      Estruture a resposta com:
      1. Descrição dos Serviços
      2. Estimativa de Horas/Homem
      3. Valor Referencial Total
      4. Observações Técnicas
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_CORE,
      },
    });
    return response.text;
  } catch (error) {
    console.error(error);
    return "Falha ao processar orçamento SINAPI.";
  }
};
