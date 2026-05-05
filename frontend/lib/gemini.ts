import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function generateResumeContent(sectionTitle: string, currentContent: string = "") {
  if (!genAI) {
    throw new Error("Gemini API key is not configured. Please add NEXT_PUBLIC_GEMINI_API_KEY to your .env file.");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    You are an expert resume writer. 
    I need to generate content for a resume section titled "${sectionTitle}".
    
    Context: ${currentContent || "No current content provided."}
    
    Please provide 3-5 professional bullet points or headings for this section.
    Return the response as a JSON array of objects, where each object has:
    - type: "heading", "text", or "bullet"
    - value: "The text content"
    
    Example:
    [
      {"type": "heading", "value": "Senior Software Engineer"},
      {"type": "text", "value": "Tech Corp"},
      {"type": "bullet", "value": "Architected a high-performance system using Node.js."}
    ]
    
    Only return the JSON array, no extra text.
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  try {
    // Extract JSON from the response (sometimes Gemini wraps it in markdown)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse Gemini response:", text);
    throw new Error("Failed to generate valid resume content.");
  }
}
