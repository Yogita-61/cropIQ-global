
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { CropData, AdvisoryResult, ImageAnalysisResult, UIStrings, DEFAULT_UI_STRINGS, SustainabilityInsight } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function translateUI(targetLanguage: string): Promise<UIStrings> {
  if (targetLanguage.toLowerCase() === 'english') return DEFAULT_UI_STRINGS;

  const prompt = `Translate the following UI labels into ${targetLanguage}. Keep the keys exactly the same. Return valid JSON.
  UI Labels: ${JSON.stringify(DEFAULT_UI_STRINGS)}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Translation failed", e);
    return DEFAULT_UI_STRINGS;
  }
}

export async function getCropAdvisory(data: CropData, targetLang: string): Promise<AdvisoryResult> {
  const prompt = `
    As an expert agricultural scientist, analyze the following crop data and provide a detailed yield prediction and advisory in ${targetLang}.
    
    CROP DATA:
    - Crop: ${data.cropName}
    - Location/Region: ${data.region}
    - Rainfall: ${data.rainfall} mm
    - Soil Nitrogen (N): ${data.nitrogen} kg/ha
    - Soil Phosphorus (P): ${data.phosphorus} kg/ha
    - Soil Potassium (K): ${data.potassium} kg/ha

    Predict if the yield will be Low, Medium, or High.
    Explain in simple, farmer-friendly language.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          yieldPrediction: { type: Type.STRING },
          irrigationAdvisory: { type: Type.STRING },
          fertilizationAdvisory: { type: Type.STRING },
          pestControlAdvisory: { type: Type.STRING },
          explanation: { type: Type.STRING }
        },
        required: ["yieldPrediction", "irrigationAdvisory", "fertilizationAdvisory", "pestControlAdvisory", "explanation"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function analyzeCropImage(base64Data: string, mimeType: string, targetLang: string): Promise<ImageAnalysisResult> {
  const prompt = `Analyze this crop image. Identify the health status, any visible diseases, nutrient deficiencies, or pest infestations. Provide actionable recommendations for the farmer. Everything must be in ${targetLang}.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType: mimeType } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          healthStatus: { type: Type.STRING },
          identifiedIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendations: { type: Type.STRING },
          confidenceScore: { type: Type.STRING }
        },
        required: ["healthStatus", "identifiedIssues", "recommendations", "confidenceScore"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function getConversationalAdvice(query: string, language: string): Promise<string> {
  const prompt = `You are CropIQ, a friendly and expert agricultural assistant. Answer the following query in a way that is easy for a small-scale farmer to understand. Answer strictly in ${language}. Query: ${query}`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });

  return response.text || "I'm sorry, I couldn't process that request.";
}

export async function getSustainabilityInsights(language: string): Promise<SustainabilityInsight[]> {
  const prompt = `Provide 4 key sustainable farming methods to improve crop yield and soil health. Include a title, content, a short tag, and a methodology (step-by-step). Focus on high-impact methods like regenerative tilling, companion planting, and bio-pesticides. All output must be in ${language}. Return as a JSON array of objects.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            tag: { type: Type.STRING },
            methodology: { type: Type.STRING }
          },
          required: ["title", "content", "tag", "methodology"]
        }
      }
    }
  });

  return JSON.parse(response.text);
}

export function connectLiveScanner(callbacks: { onopen: () => void, onmessage: (msg: any) => void, onerror: (e: any) => void, onclose: (e: any) => void }, language: string) {
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: `You are the Real-time CropIQ Vision Engine. 
      CRITICAL: You will receive a rapid stream of camera frames. 
      Your task is to provide INSTANT identification. 
      Identify the crop, its health, and any pests IMMEDIATELY.
      Keep descriptions to exactly ONE short phrase. 
      Example: "Healthy Corn detected." or "Tomato with Aphids - use Neem Oil."
      Speak in ${language}.`,
      outputAudioTranscription: {}
    }
  });
}
