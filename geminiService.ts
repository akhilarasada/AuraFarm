
import { GoogleGenAI, Type } from "@google/genai";
import { OutfitAnalysis, AccessorySuggestion, CuratedSet } from "./types";

export class GeminiService {
  private imageCache = new Map<string, string>();
  private pendingImages = new Map<string, Promise<string | undefined>>();

  /**
   * Fast text-only analysis that returns suggestions immediately.
   */
  async analyzeOutfitText(images: string[]): Promise<OutfitAnalysis> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const imageParts = images.map(base64 => {
      const match = base64.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
      const mimeType = match ? match[1] : "image/jpeg";
      const data = match ? match[2] : base64.split(',')[1];
      return { inlineData: { data, mimeType } };
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          ...imageParts,
          { text: `Analyze this outfit. 
            RULES:
            1. Identify detected garments.
            2. If BOTH top and bottom are present, suggest ONLY accessories (shoes, watches, bags, jewelry, eyewear).
            3. If EITHER top or bottom is missing, suggest the missing garment as a priority suggestion.
            4. Provide 6-9 suggestions in total.
            5. Create 2-3 "curatedSets" which are bundles of these suggestions (itemIds must match suggestion ids).
            6. Return valid JSON.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            styleName: { type: Type.STRING },
            description: { type: Type.STRING },
            colorPalette: { type: Type.ARRAY, items: { type: Type.STRING } },
            occasions: { type: Type.ARRAY, items: { type: Type.STRING } },
            detectedPieces: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  category: { type: Type.STRING },
                  description: { type: Type.STRING },
                  styleReason: { type: Type.STRING },
                  id: { type: Type.STRING }
                },
                required: ["name", "category", "description", "styleReason", "id"]
              }
            },
            curatedSets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  vibe: { type: Type.STRING },
                  itemIds: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["name", "vibe", "itemIds"]
              }
            }
          },
          required: ["styleName", "description", "colorPalette", "occasions", "suggestions", "detectedPieces", "curatedSets"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  }

  /**
   * Smart Product Image Fetcher: Checks cache first, then deduplicates pending requests.
   */
  async getProductImage(suggestion: AccessorySuggestion): Promise<string | undefined> {
    if (this.imageCache.has(suggestion.id)) {
      return this.imageCache.get(suggestion.id);
    }

    if (this.pendingImages.has(suggestion.id)) {
      return this.pendingImages.get(suggestion.id);
    }

    const imagePromise = this.generateSingleImage(suggestion);
    this.pendingImages.set(suggestion.id, imagePromise);

    const url = await imagePromise;
    if (url) {
      this.imageCache.set(suggestion.id, url);
    }
    
    this.pendingImages.delete(suggestion.id);
    return url;
  }

  private async generateSingleImage(suggestion: AccessorySuggestion): Promise<string | undefined> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Luxury e-commerce product photography of: ${suggestion.name}. Context: ${suggestion.description}. High-end fashion aesthetic, minimalist white studio background, clean lighting, 4k resolution.`;
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio: "1:1" } },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    } catch (e) {
      console.error("Image generation failed:", e);
    }
    return undefined;
  }

  async generateMoreSuggestions(analysis: OutfitAnalysis): Promise<AccessorySuggestion[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const existingNames = analysis.suggestions.map(s => s.name).join(", ");
    
    const prompt = `Based on the style profile "${analysis.styleName}" (${analysis.description}), suggest 6 additional accessories or missing clothes that were NOT already mentioned: ${existingNames}. Return as structured JSON array of suggestions. Use unique IDs.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING },
              description: { type: Type.STRING },
              styleReason: { type: Type.STRING },
              id: { type: Type.STRING }
            },
            required: ["name", "category", "description", "styleReason", "id"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  }

  /**
   * Generates additional Lookbooks based on current suggestions.
   */
  async generateMoreLookbooks(analysis: OutfitAnalysis): Promise<CuratedSet[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const existingSets = analysis.curatedSets.map(s => s.name).join(", ");
    const availableIds = analysis.suggestions.map(s => s.id).join(", ");

    const prompt = `Create 3 NEW curated lookbook sets using ONLY these available item IDs: [${availableIds}]. 
    The sets should have unique names different from existing sets: [${existingSets}]. 
    Each set must have a 'name', 'vibe', and 'itemIds' array. Return JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              vibe: { type: Type.STRING },
              itemIds: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["name", "vibe", "itemIds"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  }

  async generateLookbookVisual(baseImage: string, items: AccessorySuggestion[]): Promise<string | undefined> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const match = baseImage.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
    const mimeType = match ? match[1] : "image/jpeg";
    const data = match ? match[2] : baseImage.split(',')[1];

    const itemsList = items.map(i => i.name).join(", ");
    const prompt = `Apply these accessories to the outfit in this image: ${itemsList}. Create a professional high-end fashion campaign photograph. The person should be wearing the suggested items along with their original outfit. Ultra-realistic, luxury fashion magazine style.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data, mimeType } },
            { text: prompt }
          ]
        },
        config: { imageConfig: { aspectRatio: "3:4" } }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    } catch (e) {
      console.error("Lookbook generation failed:", e);
    }
    return undefined;
  }
}

export const gemini = new GeminiService();
