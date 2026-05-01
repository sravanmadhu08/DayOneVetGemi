import { GoogleGenAI } from "@google/genai";
import { Question } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function parseQuestionsFromText(text: string): Promise<Question[]> {
  const prompt = `
    Extract professional veterinary medical questions from the following text and format them as a JSON array matching the Question interface.
    Each question must have:
    - id: a unique string
    - question: the text of the question
    - options: an array of 4 string options
    - correctAnswer: index (0-3) of the correct option
    - explanation: a detailed explanation of why it is correct
    - species: an array of strings (e.g. ["Canine", "Bovine"])
    - system: a string (e.g. "Cardiology", "Neurology")

    Text to parse:
    ${text}

    Return ONLY the valid JSON array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    
    const jsonText = response.text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    throw new Error("Failed to parse questions. Please check the format.");
  }
}
