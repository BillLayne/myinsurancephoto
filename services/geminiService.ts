import { GoogleGenAI } from "@google/genai";
import { PhotoRequirement } from "../types";

const getGeminiClient = () => {
    // The API key is injected automatically via the AI Studio key selection flow.
    // We create a new instance every time to ensure we pick up the latest key if it changes.
    const apiKey = process.env.API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
};

export const analyzeImage = async (file: File, requirementLabel: string): Promise<{ isValid: boolean; feedback: string }> => {
  const client = getGeminiClient();
  
  if (!client) {
    return { isValid: true, feedback: "AI verification skipped (API Key missing)" };
  }

  try {
    // Convert file to base64
    const base64Data = await fileToGenerativePart(file);

    const prompt = `
      You are an expert insurance underwriter assistant. 
      The user has uploaded an image claiming it is: "${requirementLabel}".
      
      Analyze the image carefully.
      1. Does the image appear to match the description "${requirementLabel}"?
      2. If it is a document (like a VIN or policy), is it legible?
      3. If it is a house/car, is it clearly visible?
      
      Respond in JSON format:
      {
        "isValid": boolean,
        "feedback": "Short, friendly sentence explaining your finding."
      }
    `;

    const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { mimeType: file.type, data: base64Data } },
                { text: prompt }
            ]
        },
        config: {
            responseMimeType: "application/json"
        }
    });

    const text = response.text || "{}";
    const result = JSON.parse(text);

    return {
        isValid: result.isValid,
        feedback: result.feedback
    };

  } catch (error) {
    console.error("Gemini analysis failed", error);
    return { isValid: true, feedback: "AI verification unavailable." };
  }
};

export const parsePolicyDocument = async (
  input: File | string
): Promise<{ clientName?: string; policyNumber?: string; address?: string; clientEmail?: string; clientPhone?: string; requirements?: PhotoRequirement[] }> => {
  const client = getGeminiClient();
  if (!client) throw new Error("API Key missing");

  try {
    const parts: any[] = [];
    
    if (typeof input === 'string') {
      parts.push({ text: input });
    } else {
      const base64Data = await fileToGenerativePart(input);
      // Default to application/pdf if type is missing, or use the file's type
      const mimeType = input.type || 'application/pdf';
      parts.push({ inlineData: { mimeType, data: base64Data } });
    }

    const prompt = `
      You are an expert insurance underwriter. I am providing a Policy Declaration, an Underwriting Request, or notes.
      
      Please extract the following information if available:
      1. Client Name
      2. Policy Number
      3. Property Address
      4. Client Email Address
      5. Client Phone Number
      
      Then, based on the text, determine what photos are needed. 
      For example:
      - If it mentions a "wood stove", add a requirement for "Wood Stove".
      - If it mentions "pool", add "Pool".
      - If it's a standard home, default to "Front", "Back", "Roof", "Electrical Panel".
      
      Return JSON format ONLY. Do not use Markdown code blocks.
      {
        "clientName": "string",
        "policyNumber": "string",
        "address": "string",
        "clientEmail": "string",
        "clientPhone": "string",
        "requirements": [
          { "label": "string", "description": "string", "isMandatory": boolean }
        ]
      }
    `;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [...parts, { text: prompt }]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    let text = response.text || "{}";
    
    // Clean up potential markdown code blocks if the model ignores the prompt
    if (text.startsWith('```json')) {
        text = text.replace(/```json\n?/, '').replace(/```/, '');
    } else if (text.startsWith('```')) {
        text = text.replace(/```\n?/, '').replace(/```/, '');
    }

    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini parse failed", error);
    throw error;
  }
};

async function fileToGenerativePart(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        if (reader.result) {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
        } else {
            reject(new Error("Failed to read file"));
        }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}