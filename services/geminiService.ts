
import { GoogleGenAI, Type } from "@google/genai";
import { FlowData, NodeType } from "../types";

const SYSTEM_INSTRUCTION = `You are an expert system architect and visual thinker. 
Your goal is to transform complex topics into clear, logical, and hierarchical flowcharts (Neural Flows). 
Each node should represent a key concept, step, or decision. 
Connect them logically to show the flow of information or causation.

Guidelines:
1. Use at least 5-8 nodes for a comprehensive view.
2. Provide a 'summary' explaining the overall logic.
3. Categorize nodes as CONCEPT, ACTION, OUTCOME, PROBLEM, or SOLUTION.
4. Keep node labels concise (1-4 words).
5. Ensure connections (edges) represent valid relationships.`;

export const generateFlow = async (prompt: string): Promise<FlowData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 32768 },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          nodes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                label: { type: Type.STRING },
                description: { type: Type.STRING },
                type: { 
                  type: Type.STRING,
                  enum: Object.values(NodeType)
                }
              },
              required: ["id", "label", "description", "type"]
            }
          },
          edges: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                from: { type: Type.STRING },
                to: { type: Type.STRING },
                label: { type: Type.STRING }
              },
              required: ["id", "from", "to"]
            }
          }
        },
        required: ["title", "summary", "nodes", "edges"]
      }
    }
  });

  const rawJson = response.text || '{}';
  const data = JSON.parse(rawJson);
  
  const nodesWithPositions = data.nodes.map((node: any, index: number) => ({
    ...node,
    x: 400 + Math.cos((index / data.nodes.length) * 2 * Math.PI) * 250,
    y: 350 + Math.sin((index / data.nodes.length) * 2 * Math.PI) * 250
  }));

  return { 
    ...data, 
    nodes: nodesWithPositions,
    groups: [] // Initialize empty groups array
  };
};
