
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getSmartRecommendation(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "你是一位資深的機車租賃管理專家。請根據客戶需求建議適合的機車型號與數量。機車型號有：ES-2000 (白牌電力), ES-1000 (綠牌電力), EB-500 (電輔車)。",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendation: { type: Type.STRING },
            suggestedScooters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  model: { type: Type.STRING },
                  count: { type: Type.NUMBER }
                },
                required: ["model", "count"]
              }
            }
          },
          required: ["recommendation", "suggestedScooters"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
}

export async function chatWithAssistant(message: string, history: any[]) {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: "你是『蘭光租賃』的管理助理。你能回答關於租賃流程、常見問題以及協助管理員查詢。請保持專業且友善。"
    }
  });
  
  // Note: Simple wrapper for streaming
  return await chat.sendMessageStream({ message });
}
