import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, Mistake } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeCode(
  mode: 'explain' | 'debug' | 'hint' | 'interview' | 'path',
  code: string,
  language: string,
  skillLevel: string,
  mistakes: Mistake[] = []
): Promise<AnalysisResult> {
  const model = "gemini-3.1-pro-preview";
  
  const mistakeContext = mistakes.length > 0 
    ? `The student has previously struggled with these concepts: ${mistakes.map(m => `${m.concept} (seen ${m.count} times)`).join(', ')}. Please pay extra attention to these if they appear in the code.`
    : "";

  let systemInstruction = `You are "Mini Code Mentor", an expert coding tutor. 
  Your goal is to help students learn programming. 
  The student's skill level is ${skillLevel} and they are using ${language}.
  Always use simple, beginner-friendly language. Avoid overly technical jargon without explaining it first.
  ${mistakeContext}`;

  let prompt = "";

  switch (mode) {
    case 'explain':
      prompt = `Explain the following code line by line. Focus on the "why" and "how". 
      Use analogies if helpful. Break down complex logic into small, digestible parts.
      Code:\n${code}`;
      break;
    case 'debug':
      prompt = `Find bugs in the following code. 
      Identify the line number, describe the error in simple terms, and provide a fix. 
      Highlight common mistake patterns and explain the underlying concept to prevent future errors.
      Code:\n${code}`;
      break;
    case 'hint':
      prompt = `The student is stuck on this code. Provide 3 smart hints to guide them toward the solution WITHOUT giving the direct answer.
      Each hint should be progressively more specific.
      Code:\n${code}`;
      break;
    case 'interview':
      prompt = `Based on this code snippet, generate 3 interview questions (1 beginner, 1 intermediate, 1 advanced) that a recruiter might ask.
      Include a brief "What to look for in an answer" section for each question.
      Code:\n${code}`;
      break;
    case 'path':
      prompt = `Based on this code and the student's level (${skillLevel}), generate a personalized 5-step learning path to master the concepts used here.
      Include specific topics to study next.
      Code:\n${code}`;
      break;
  }

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          explanation: { type: Type.STRING },
          bugs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                line: { type: Type.INTEGER },
                description: { type: Type.STRING },
                fix: { type: Type.STRING }
              }
            }
          },
          hints: { type: Type.ARRAY, items: { type: Type.STRING } },
          learningPath: { type: Type.ARRAY, items: { type: Type.STRING } },
          interviewQuestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                difficulty: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function chatWithMentor(
  message: string,
  history: { role: 'user' | 'model', parts: { text: string }[] }[],
  skillLevel: string,
  language: string
): Promise<string> {
  const model = "gemini-3.1-pro-preview";
  
  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction: `You are "Mini Code Mentor", an expert coding tutor. 
      The student's skill level is ${skillLevel} and they are using ${language}.
      Always use simple, beginner-friendly language. 
      Help them with follow-up questions about their code or the analysis you provided.
      If they are answering an interview question, provide constructive feedback.`,
    },
    history: history
  });

  const response = await chat.sendMessage({ message });
  return response.text || "I'm sorry, I couldn't process that.";
}
