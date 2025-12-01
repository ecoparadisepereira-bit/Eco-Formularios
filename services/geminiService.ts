import { GoogleGenAI, Type } from "@google/genai";
import { FormSchema, FieldType } from '../types';

// Helper to generate a random ID
const generateId = () => Math.random().toString(36).substr(2, 9);

export const generateFormSchema = async (prompt: string): Promise<Partial<FormSchema>> => {
  // Check if API KEY is present
  if (!process.env.API_KEY) {
    console.error("API Key is missing in environment variables.");
    throw new Error("MISSING_KEY");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `
    You are an expert Form Builder assistant. 
    Your task is to generate a JSON schema for a web form based on the user's description.
    Focus on creating a relevant, user-friendly structure.
    
    Available Field Types:
    - short_text (Names, Emails, simple inputs)
    - long_text (Comments, Descriptions)
    - number (Age, Quantity, Ratings)
    - single_select (Categories, Options - MUST Provide options array)
    - image_upload (Photos, Documents)

    If the user doesn't specify details, infer reasonable defaults.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a form for: ${prompt}`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            fields: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  type: { 
                    type: Type.STRING, 
                    enum: [
                      'short_text', 
                      'long_text', 
                      'number', 
                      'single_select', 
                      'image_upload'
                    ] 
                  },
                  required: { type: Type.BOOLEAN },
                  placeholder: { type: Type.STRING },
                  options: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "Required only for single_select"
                  }
                },
                required: ['label', 'type', 'required']
              }
            },
            thankYouTitle: { type: Type.STRING },
            thankYouMessage: { type: Type.STRING }
          },
          required: ['title', 'description', 'fields', 'thankYouTitle', 'thankYouMessage']
        }
      }
    });

    const result = JSON.parse(response.text || '{}');

    // Post-process to add internal IDs which GenAI might not generate consistently
    const processedFields = (result.fields || []).map((f: any) => ({
      ...f,
      id: generateId(),
      validation: f.type === 'number' ? { min: 0 } : undefined // Basic default
    }));

    return {
      title: result.title,
      description: result.description,
      fields: processedFields,
      thankYouScreen: {
        title: result.thankYouTitle,
        message: result.thankYouMessage,
        redirectUrl: '',
        buttonText: 'Volver al Inicio'
      }
    };

  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    if (error.message === "MISSING_KEY") {
        throw new Error("Falta la API KEY en la configuración de Vercel (Environment Variables).");
    }
    throw new Error("No se pudo conectar con la IA. Verifica tu conexión o intenta de nuevo.");
  }
};