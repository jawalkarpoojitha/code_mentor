export interface User {
  id: number;
  name: string;
  email: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredLanguage: string;
}

export interface AnalysisResult {
  explanation?: string;
  bugs?: { line: number; description: string; fix: string }[];
  hints?: string[];
  learningPath?: string[];
  interviewQuestions?: { question: string; difficulty: string }[];
  executionOutput?: string;
  executionError?: string;
}

export interface HistoryItem {
  id: number;
  mode: string;
  code: string;
  analysis: string;
  created_at: string;
}

export interface Mistake {
  id: number;
  concept: string;
  count: number;
  last_seen: string;
}
