import { GoogleGenerativeAI } from "@google/generative-ai";

function requireStringEnv(value: unknown, name: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${name} ausente`);
  }
  return value.trim();
}

const apiKey = requireStringEnv(
  import.meta.env.VITE_GEMINI_API_KEY,
  "VITE_GEMINI_API_KEY"
);

const genAI = new GoogleGenerativeAI(apiKey);

// Modelo leve e rápido (bom pra MVP)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const SYSTEM_INSTRUCTION_CORE = `
Você é o Engenheiro Chefe da Zeloo, uma plataforma premium de manutenção residencial.
Seu conhecimento baseia-se em normas técnicas (ABNT) e boas práticas.
Explique o problema e oriente a melhor solução técnica de forma clara e profissional.
`;

export async function getMaintenanceAdvice(issue: string): Promise<string> {
  try {
    const prompt = `
${SYSTEM_INSTRUCTION_CORE}

O usuário relatou o seguinte problema:
"${issue}"

Responda com diagnóstico, possíveis causas e próximos passos.
`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Erro Gemini:", error);
    return "Erro ao consultar o assistente técnico.";
  }
}
