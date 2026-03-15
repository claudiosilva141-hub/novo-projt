import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { GEMINI_MODEL_TEXT } from '../constants';
import { formatCurrency } from '../utils/currencyFormatter';

const getGeminiClient = () => {
  // CRITICAL: Create a new GoogleGenAI instance right before making an API call
  // to ensure it always uses the most up-to-date API key from the dialog.
  if (!process.env.API_KEY) {
    console.error("API_KEY is not defined. Please ensure it's set in your environment.");
    // In a real app, you might throw an error or handle this more gracefully
    // For now, we'll return a mock client or null
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Generates a product description using the Gemini API.
 * @param productName heartbroken The name of the product.
 * @param keywords Optional keywords to include in the description.
 * @returns A Promise that resolves with the generated description string.
 */
export const generateProductDescription = async (
  productName: string,
  keywords?: string
): Promise<string> => {
  const ai = getGeminiClient();
  if (!ai) {
    return 'Erro: Chave de API não configurada para gerar descrição.';
  }

  const prompt = `Gere uma descrição de produto criativa e comercial para "${productName}". Inclua detalhes sobre tecido, estilo e para quem se destina. ${
    keywords ? `Palavras-chave: ${keywords}.` : ''
  } A descrição deve ter no máximo 100 palavras.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 200, // Limit output to prevent overly long descriptions
        thinkingConfig: { thinkingBudget: 50 }, // Allocate tokens for thinking
      },
    });

    const text = response.text;
    if (text) {
      return text.trim();
    } else {
      console.warn('Gemini API returned no text for product description.');
      return 'Não foi possível gerar uma descrição no momento. Tente novamente.';
    }
  } catch (error) {
    console.error('Error generating product description with Gemini API:', error);
    return 'Ocorreu um erro ao gerar a descrição do produto. Verifique a chave da API ou tente novamente mais tarde.';
  }
};

/**
 * Summarizes a given report text using the Gemini API.
 * @param reportText The text content of the report to summarize.
 * @returns A Promise that resolves with the summarized text string.
 */
export const summarizeReport = async (reportText: string): Promise<string> => {
  const ai = getGeminiClient();
  if (!ai) {
    return 'Erro: Chave de API não configurada para resumir relatório.';
  }

  const prompt = `Resuma o seguinte relatório de atividades de vendas e pedidos em um parágrafo conciso, destacando os pontos mais importantes, como total de vendas, valor de ordens de serviço, custos de produção, número de pedidos e itens populares. Relatório:\n\n${reportText}`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        temperature: 0.7,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 200, // Limit output for conciseness
        thinkingConfig: { thinkingBudget: 50 }, // Allocate tokens for thinking
      },
    });

    const text = response.text;
    if (text) {
      return text.trim();
    } else {
      console.warn('Gemini API returned no text for report summary.');
      return 'Não foi possível gerar um resumo para o relatório.';
    }
  } catch (error) {
    console.error('Error summarizing report with Gemini API:', error);
    return 'Ocorreu um erro ao resumir o relatório. Verifique a chave da API ou tente novamente mais tarde.';
  }
};