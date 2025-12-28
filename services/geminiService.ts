import { GoogleGenAI } from "@google/genai";
import { Message, Role, Attachment } from "../types";
import { MODEL_NAME, SYSTEM_INSTRUCTION } from "../constants";

// Helper to convert internal Message type to API content format
const mapMessagesToContent = (messages: Message[]) => {
  return messages.map((msg) => {
    const parts: any[] = [];
    
    // Add text part
    if (msg.text) {
      parts.push({ text: msg.text });
    }

    // Add attachment parts (images)
    if (msg.attachments && msg.attachments.length > 0) {
      msg.attachments.forEach((att) => {
        parts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.data,
          },
        });
      });
    }

    return {
      role: msg.role === Role.USER ? 'user' : 'model',
      parts: parts,
    };
  });
};

export const sendMessageToGemini = async (
  history: Message[],
  newMessageText: string,
  attachments: Attachment[] = [],
  onUpdate: (text: string, groundingMetadata?: any, suggestions?: string[]) => void
): Promise<void> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Prepare the conversation history
  const contents = mapMessagesToContent(history);
  
  // Construct the new user message part
  const newParts: any[] = [{ text: newMessageText }];
  attachments.forEach(att => {
    newParts.push({
      inlineData: {
        mimeType: att.mimeType,
        data: att.data
      }
    });
  });

  contents.push({
    role: 'user',
    parts: newParts
  });

  try {
    const responseStream = await ai.models.generateContentStream({
      model: MODEL_NAME,
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }], // Enable grounding
      },
    });

    let fullText = "";
    let finalMetadata = undefined;
    let suggestions: string[] = [];

    for await (const chunk of responseStream) {
        const chunkText = chunk.text;
        if (chunkText) {
            fullText += chunkText;
            
            // Capture metadata if present in this chunk (usually at the end)
            if (chunk.candidates?.[0]?.groundingMetadata) {
                finalMetadata = chunk.candidates[0].groundingMetadata;
            }
            
            // Check for suggestions delimiter
            let displayText = fullText;
            if (fullText.includes("|||")) {
                const parts = fullText.split("|||");
                displayText = parts[0].trim();
                const suggestionBlock = parts[1];
                suggestions = suggestionBlock.split('\n').filter(s => s.trim().length > 0).slice(0, 3);
            }
            
            onUpdate(displayText, finalMetadata, suggestions.length > 0 ? suggestions : undefined);
        }
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateChatTitle = async (history: Message[]): Promise<string> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return "New Investigation";
    
    const ai = new GoogleGenAI({ apiKey });
    // Use last few messages to generate title
    const recentMessages = history.slice(-4);
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [
                ...mapMessagesToContent(recentMessages),
                { role: 'user', parts: [{ text: "Generate a short, scientific, 3-5 word title for this conversation. Return ONLY the title text, nothing else." }] }
            ]
        });
        return response.text?.trim() || "Scientific Investigation";
    } catch (e) {
        return "Scientific Investigation";
    }
};

export const generateInitialSuggestions = async (): Promise<string[]> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return [];

    const ai = new GoogleGenAI({ apiKey });
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: "Generate 4 intriguing, diverse, and scientific questions about nature, plants, or the environment that a user might want to ask an expert. Keep them short (under 10 words). Return ONLY the questions separated by newlines.",
            config: {
                temperature: 0.9 
            }
        });
        return response.text?.split('\n').filter(s => s.trim().length > 0).slice(0, 4) || [];
    } catch (e) {
        return [];
    }
}