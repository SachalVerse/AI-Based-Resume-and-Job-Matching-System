import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { sectionTitle, currentContent } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured on the server." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
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
    const text = result.response.text();

    // Extract JSON from response (Gemini sometimes wraps in markdown)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("[Gemini API Route] Error:", error?.message || error);
    return NextResponse.json(
      { error: "Failed to generate content. Please try again." },
      { status: 500 }
    );
  }
}
