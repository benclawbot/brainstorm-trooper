
import { GoogleGenAI, Type } from "@google/genai";
import { MindMapNode, Language } from '../types';

/**
 * Service to handle all interactions with the Gemini API.
 */

const getSystemInstruction = (lang: Language) => {
  const targetLang = lang === 'fr' ? 'French' : 'English';
  return `You are a "Strict Linguistic Architect". 
1. You MUST respond 100% in ${targetLang}.
2. Every single word of your output (titles, content, JSON values, table headers) MUST be in ${targetLang}.
3. DO NOT use any other language, even if the user input is in another language.
4. Total linguistic homogeneity is mandatory.
5. Never translate to English unless the target language is English.`;
};

export const expandIdea = async (content: string, lang: Language = 'en') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Transform this idea into a structured plan: "${content}".`,
    config: {
      systemInstruction: getSystemInstruction(lang),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          content: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["title", "content", "tags"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

export const generateDeepMindMap = async (rootTopic: string, lang: Language = 'en'): Promise<MindMapNode> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const nodeSchema = {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      text: { type: Type.STRING },
      children: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            text: { type: Type.STRING },
            children: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  text: { type: Type.STRING },
                  children: { 
                    type: Type.ARRAY, 
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        text: { type: Type.STRING }
                      },
                      required: ["id", "text"]
                    }
                  }
                },
                required: ["id", "text"]
              }
            }
          },
          required: ["id", "text"]
        }
      }
    },
    required: ["id", "text", "children"]
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Architect a comprehensive 3-level mind map for: "${rootTopic}". 
    
    Structure:
    Level 1: The Root (use the provided topic).
    Level 2: Exactly 4 distinct strategic categories.
    Level 3: Exactly 3 sub-points for EACH Level 2 category.`,
    config: {
      systemInstruction: getSystemInstruction(lang) + "\nEnsure all nodes are strictly in the target language.",
      responseMimeType: "application/json",
      responseSchema: nodeSchema
    }
  });
  
  try {
    const data = JSON.parse(response.text || '{}');
    const ensureChildren = (node: any): MindMapNode => ({
      id: node.id || Math.random().toString(36).substr(2, 9),
      text: node.text || "Untitled",
      children: Array.isArray(node.children) ? node.children.map(ensureChildren) : []
    });
    return ensureChildren(data);
  } catch (e) {
    console.error("Failed to parse mind map response", e);
    return { id: 'root-' + Date.now(), text: rootTopic, children: [] };
  }
};

export const suggestSubBranches = async (topic: string, path: string[], lang: Language = 'en') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-flash-lite-latest',
    contents: `Topic: "${topic}". Context: "${path[0]}". Provide 4-5 short related sub-concepts.`,
    config: {
      systemInstruction: getSystemInstruction(lang),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      thinkingConfig: { thinkingBudget: 0 }
    }
  });
  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    return [];
  }
};

export const researchIdea = async (topic: string, lang: Language = 'en') => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Research Dossier for: "${topic}". Provide a structured executive summary followed by key findings using Markdown tables.`,
    config: {
      systemInstruction: getSystemInstruction(lang) + "\nUse grounding to find facts but report them ONLY in the target language.",
      tools: [{ googleSearch: {} }],
    }
  });

  const text = response.text || '';
  const links = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
    title: chunk.web?.title || 'External Source',
    url: chunk.web?.uri || '#'
  })) || [];

  return { text, links };
};

export const generateVisual = async (prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `A professional visual for: ${prompt}. Clean, cinematic, futuristic.` }]
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};
