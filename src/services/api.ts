import { User, HistoryItem, Mistake } from "../types";

const API_BASE = "/api";

function getHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    let errorData;
    try {
      errorData = await res.json();
    } catch (e) {
      errorData = { error: await res.text() };
    }
    throw new Error(errorData.error || "An unexpected error occurred");
  }
  return res.json();
}

export const authApi = {
  async signup(data: any) {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async login(data: any) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  async me(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Unauthorized");
    return res.json();
  },
};

export const mentorApi = {
  async getHistory(): Promise<HistoryItem[]> {
    const res = await fetch(`${API_BASE}/history`, { headers: getHeaders() });
    return res.json();
  },
  async saveHistory(data: any) {
    const res = await fetch(`${API_BASE}/history`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async getMistakes(): Promise<Mistake[]> {
    const res = await fetch(`${API_BASE}/mistakes`, { headers: getHeaders() });
    return res.json();
  },
  async trackMistake(concept: string) {
    const res = await fetch(`${API_BASE}/mistakes`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ concept }),
    });
    return res.json();
  },
  async executeCode(code: string, language: string): Promise<{ output: string; error?: string }> {
    const languageMap: Record<string, number> = {
      'c': 50,
      'cpp': 54,
      'java': 62,
      'python': 71,
      'javascript': 63,
      'csharp': 51,
      'go': 60,
      'php': 68,
      'ruby': 72
    };

    const languageId = languageMap[language] || 63;

    try {
      // Using public Judge0 instance for demo purposes
      const response = await fetch("https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=true", {
        method: "POST",
        headers: {
          "x-rapidapi-key": import.meta.env.VITE_JUDGE0_KEY || "YOUR_RAPIDAPI_KEY",
          "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          source_code: btoa(code),
          language_id: languageId,
        })
      });

      const data = await response.json();
      
      if (data.stdout) {
        return { output: atob(data.stdout) };
      } else if (data.stderr || data.compile_output) {
        return { output: "", error: atob(data.stderr || data.compile_output) };
      } else {
        return { output: "No output" };
      }
    } catch (err) {
      console.error("Execution error:", err);
      return { output: "", error: "Code execution failed. Please check your internet connection or API key." };
    }
  }
};
