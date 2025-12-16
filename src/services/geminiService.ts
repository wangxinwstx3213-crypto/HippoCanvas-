import { GoogleGenAI } from "@google/genai";
import { SystemSettings } from "../types";

interface GenerateImageOptions {
  prompt: string;
  referenceImages?: string[]; // Array of base64 strings
  aspectRatio?: '1:1' | '16:9' | '9:16' | '3:4' | '4:3';
}

export const generateImageWithGemini = async (
  options: GenerateImageOptions, 
  settings: SystemSettings
): Promise<string> => {
  
  // The API key must be obtained exclusively from the environment variable process.env.API_KEY.
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    throw new Error("API Key is missing. Please ensure you have selected a Google Cloud project.");
  }

  // Initialize client dynamically based on settings
  const clientOptions: any = { apiKey };
  if (settings.baseUrl && settings.baseUrl.trim() !== '') {
    clientOptions.baseUrl = settings.baseUrl;
  }
  
  const ai = new GoogleGenAI(clientOptions);

  const { prompt, referenceImages, aspectRatio = "1:1" } = options;

  try {
    const parts: any[] = [];

    // Add reference images if they exist
    if (referenceImages && referenceImages.length > 0) {
      referenceImages.forEach((base64Data) => {
        // Strip prefix if present (e.g., "data:image/png;base64,")
        const cleanBase64 = base64Data.split(',')[1] || base64Data;
        parts.push({
          inlineData: {
            data: cleanBase64,
            mimeType: 'image/png', // Assuming PNG for simplicity, Gemini handles standard types
          },
        });
      });
    }

    // Add the text prompt
    parts.push({ text: prompt });

    // Use configured model name or default
    const modelId = settings.modelName || 'gemini-3-pro-image-preview';

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: parts,
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: "1K", // Defaulting to 1K for speed/stability in demo
        },
      },
    });

    // Extract the image from the response
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
           return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image data found in response");

  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    throw error;
  }
};