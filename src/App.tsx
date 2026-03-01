import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { 
  Code2, 
  Terminal, 
  Lightbulb, 
  Bug, 
  User as UserIcon, 
  History, 
  LogOut, 
  LayoutDashboard,
  GraduationCap,
  Briefcase,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Menu,
  X,
  Sparkles,
  Globe,
  Play,
  MessageSquare
} from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { php } from '@codemirror/lang-php';
import { go } from '@codemirror/lang-go';
import { rust } from '@codemirror/lang-rust';
import { sql } from '@codemirror/lang-sql';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { User, AnalysisResult, HistoryItem, Mistake } from './types';
import { authApi, mentorApi } from './services/api';
import { analyzeCode, chatWithMentor } from './services/ai';

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Auth Context ---
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: any) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await authApi.me();
          setUser(userData);
        } catch (e) {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (data: any) => {
    const { token, user: userData } = await authApi.login(data);
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const signup = async (data: any) => {
    const { token, user: userData } = await authApi.signup(data);
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// --- Components ---

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-dark-bg/80 backdrop-blur-md border-b border-dark-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-neon-green p-1.5 rounded-lg shadow-[0_0_10px_rgba(57,255,20,0.5)] group-hover:shadow-[0_0_20px_rgba(57,255,20,0.8)] transition-all">
                <Sparkles className="w-6 h-6 text-black animate-sparkle" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Mini Code Mentor <span className="text-neon-green">2.0</span>
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {user ? (
              <>
                <Link to="/dashboard" className="text-gray-400 hover:text-neon-green font-medium transition-colors">Dashboard</Link>
                <Link to="/history" className="text-gray-400 hover:text-neon-green font-medium transition-colors">History</Link>
                <div className="flex items-center gap-3 pl-6 border-l border-dark-border">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-semibold text-white">{user.name}</span>
                    <span className="text-xs text-neon-green/70 capitalize">{user.skillLevel}</span>
                  </div>
                  <button 
                    onClick={logout}
                    className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-400 hover:text-neon-green font-medium">Login</Link>
                <Link to="/signup" className="bg-neon-green text-black px-5 py-2 rounded-full font-bold hover:bg-neon-green/90 transition-all shadow-[0_0_15px_rgba(57,255,20,0.3)]">
                  Get Started
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-400">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-dark-card border-b border-dark-border"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {user ? (
                <>
                  <Link to="/dashboard" className="block px-3 py-2 text-gray-400 font-medium">Dashboard</Link>
                  <Link to="/history" className="block px-3 py-2 text-gray-400 font-medium">History</Link>
                  <button onClick={logout} className="block w-full text-left px-3 py-2 text-red-500 font-medium">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block px-3 py-2 text-gray-400 font-medium">Login</Link>
                  <Link to="/signup" className="block px-3 py-2 text-neon-green font-medium">Sign Up</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// --- Pages ---

const LandingPage = () => {
  return (
    <div className="bg-dark-bg min-h-screen">
      <div className="relative isolate pt-14">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#39FF14] to-[#000] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
        </div>
        
        <div className="py-24 sm:py-32 lg:pb-40">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-green/10 border border-neon-green/20 text-neon-green text-xs font-bold mb-8"
              >
                <Sparkles className="w-3 h-3" />
                <span>v2.0 is now live</span>
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold tracking-tight text-white sm:text-7xl"
              >
                Mini Code Mentor
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-6 text-xl leading-8 text-gray-400"
              >
                Your AI pair mentor for faster, smarter learning. Explain code, detect bugs, and prepare for interviews with precision.
              </motion.p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link to="/signup" className="rounded-full bg-neon-green px-8 py-4 text-sm font-bold text-black shadow-[0_0_20px_rgba(57,255,20,0.3)] hover:bg-neon-green/90 transition-all">
                  Start Learning Free
                </Link>
                <Link to="/login" className="text-sm font-bold leading-6 text-white hover:text-neon-green transition-colors">
                  Live Demo <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SignupPage = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    skillLevel: 'beginner',
    preferredLanguage: 'javascript'
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signup(formData);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-dark-bg px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-dark-card p-8 rounded-2xl shadow-2xl border border-dark-border"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">Create Account</h2>
          <p className="text-gray-500 mt-2">Start your personalized coding journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-500/10 text-red-400 rounded-lg text-sm flex items-center gap-2 border border-red-500/20"><AlertCircle className="w-4 h-4" /> {error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
            <input 
              type="text" required
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-white rounded-lg focus:ring-2 focus:ring-neon-green outline-none transition-all"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
            <input 
              type="email" required
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-white rounded-lg focus:ring-2 focus:ring-neon-green outline-none transition-all"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <input 
              type="password" required
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-white rounded-lg focus:ring-2 focus:ring-neon-green outline-none transition-all"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Skill Level</label>
              <select 
                className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-white rounded-lg focus:ring-2 focus:ring-neon-green outline-none"
                value={formData.skillLevel}
                onChange={e => setFormData({...formData, skillLevel: e.target.value as any})}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Language</label>
              <select 
                className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-white rounded-lg focus:ring-2 focus:ring-neon-green outline-none"
                value={formData.preferredLanguage}
                onChange={e => setFormData({...formData, preferredLanguage: e.target.value})}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
                <option value="java">Java</option>
                <option value="csharp">C#</option>
                <option value="go">Go</option>
                <option value="php">PHP</option>
                <option value="ruby">Ruby</option>
                <option value="sql">SQL</option>
              </select>
            </div>
          </div>

          <button className="w-full bg-neon-green text-black py-3 rounded-lg font-bold hover:bg-neon-green/90 transition-all shadow-[0_0_15px_rgba(57,255,20,0.2)] mt-4">
            Sign Up
          </button>
        </form>

        <p className="text-center text-gray-500 mt-6 text-sm">
          Already have an account? <Link to="/login" className="text-neon-green font-bold hover:underline">Login</Link>
        </p>
      </motion.div>
    </div>
  );
};

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-dark-bg px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-dark-card p-8 rounded-2xl shadow-2xl border border-dark-border"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
          <p className="text-gray-500 mt-2">Continue your learning session</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="p-3 bg-red-500/10 text-red-400 rounded-lg text-sm flex items-center gap-2 border border-red-500/20"><AlertCircle className="w-4 h-4" /> {error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
            <input 
              type="email" required
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-white rounded-lg focus:ring-2 focus:ring-neon-green outline-none transition-all"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
            <input 
              type="password" required
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-white rounded-lg focus:ring-2 focus:ring-neon-green outline-none transition-all"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button className="w-full bg-neon-green text-black py-3 rounded-lg font-bold hover:bg-neon-green/90 transition-all shadow-[0_0_15px_rgba(57,255,20,0.2)] mt-4">
            Login
          </button>
        </form>

        <p className="text-center text-gray-500 mt-6 text-sm">
          Don't have an account? <Link to="/signup" className="text-neon-green font-bold hover:underline">Sign Up</Link>
        </p>
      </motion.div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState(user?.preferredLanguage || 'javascript');
  const [mode, setMode] = useState<'explain' | 'debug' | 'hint' | 'interview' | 'path'>('explain');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model', parts: { text: string }[] }[]>([]);
  const [isChatting, setIsChatting] = useState(false);

  const getLanguageExtension = () => {
    switch (language) {
      case 'python': return [python()];
      case 'cpp': return [cpp()];
      case 'java': return [java()];
      case 'php': return [php()];
      case 'go': return [go()];
      case 'rust': return [rust()];
      case 'sql': return [sql()];
      default: return [javascript()];
    }
  };

  const handleExecute = async () => {
    if (!code.trim()) return;
    setIsAnalyzing(true);
    try {
      const { output, error } = await mentorApi.executeCode(code, language);
      setResult(prev => ({
        ...prev,
        executionOutput: output,
        executionError: error
      } as any));
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!code.trim()) return;
    setIsAnalyzing(true);
    setResult(null);
    setChatMessages([]);
    try {
      // Fetch mistakes for adaptive learning
      const mistakes = await mentorApi.getMistakes();
      
      const analysis = await analyzeCode(mode, code, language, user?.skillLevel || 'beginner', mistakes);
      setResult(analysis);
      
      // Initialize chat history with the analysis
      setChatMessages([
        { role: 'model', parts: [{ text: `I've analyzed your code in ${mode} mode. Here's what I found:\n\n${analysis.explanation || ''}` }] }
      ]);
      
      // Save to history
      await mentorApi.saveHistory({ mode, code, analysis });
      
      // Track mistakes if in debug mode
      if (mode === 'debug' && analysis.bugs?.length) {
        analysis.bugs.forEach(bug => {
          // Extract concept from description (e.g., "Loop", "Syntax", "Variable")
          const concept = bug.description.split(' ')[0].replace(/[^a-zA-Z]/g, '');
          if (concept.length > 2) {
            mentorApi.trackMistake(concept);
          }
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatting) return;

    const userMessage = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', parts: [{ text: userMessage }] }]);
    setIsChatting(true);

    try {
      const response = await chatWithMentor(userMessage, chatMessages, user?.skillLevel || 'beginner', language);
      setChatMessages(prev => [...prev, { role: 'model', parts: [{ text: response }] }]);
    } catch (error) {
      console.error(error);
      setChatMessages(prev => [...prev, { role: 'model', parts: [{ text: "Sorry, I'm having trouble responding right now." }] }]);
    } finally {
      setIsChatting(false);
    }
  };

  const modes = [
    { id: 'explain', label: 'Explain', icon: Terminal, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { id: 'debug', label: 'Debug', icon: Bug, color: 'text-red-400', bg: 'bg-red-400/10' },
    { id: 'hint', label: 'Hints', icon: Lightbulb, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { id: 'interview', label: 'Interview', icon: Briefcase, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { id: 'path', label: 'Roadmap', icon: GraduationCap, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Editor */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-dark-card rounded-2xl shadow-xl border border-dark-border overflow-hidden">
            <div className="px-4 py-3 border-b border-dark-border flex items-center justify-between bg-dark-card/50">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-bg rounded-lg border border-dark-border">
                  <Globe className="w-4 h-4 text-neon-green" />
                  <select 
                    className="bg-transparent text-white text-sm outline-none cursor-pointer"
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="cpp">C++</option>
                    <option value="c">C</option>
                    <option value="java">Java</option>
                    <option value="csharp">C#</option>
                    <option value="go">Go</option>
                    <option value="php">PHP</option>
                    <option value="ruby">Ruby</option>
                    <option value="sql">SQL</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleExecute}
                  disabled={isAnalyzing || !code.trim()}
                  className="flex items-center gap-2 px-4 py-1.5 bg-neon-green text-black rounded-lg font-bold text-sm hover:bg-neon-green/90 transition-all disabled:opacity-50"
                >
                  <Play className="w-4 h-4" />
                  Run
                </button>
              </div>
            </div>
            <CodeMirror
              value={code}
              height="500px"
              theme="dark"
              extensions={getLanguageExtension()}
              onChange={(value) => setCode(value)}
              className="text-base"
            />
          </div>

          {/* Execution Output */}
          {(result?.executionOutput || result?.executionError) && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-dark-card rounded-2xl border border-dark-border overflow-hidden"
            >
              <div className="px-4 py-2 border-b border-dark-border bg-dark-card/50 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-neon-green" />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Console Output</span>
              </div>
              <div className="p-4 font-mono text-sm">
                {result.executionOutput && <pre className="text-emerald-400">{result.executionOutput}</pre>}
                {result.executionError && <pre className="text-red-400">{result.executionError}</pre>}
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-5 gap-3">
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id as any)}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1.5",
                  mode === m.id 
                    ? "border-neon-green bg-neon-green/10 shadow-[0_0_10px_rgba(57,255,20,0.1)]" 
                    : "border-dark-border bg-dark-card hover:border-gray-600"
                )}
              >
                <m.icon className={cn("w-5 h-5", mode === m.id ? "text-neon-green" : "text-gray-500")} />
                <span className={cn("text-[10px] font-bold uppercase tracking-wider", mode === m.id ? "text-neon-green" : "text-gray-500")}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>

          <button 
            onClick={handleAnalyze}
            disabled={isAnalyzing || !code.trim()}
            className="w-full bg-white text-black py-4 rounded-xl font-bold text-lg hover:bg-gray-200 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isAnalyzing ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-6 h-6 text-indigo-600" />
                Get AI Guidance
              </>
            )}
          </button>
        </div>

        {/* Right Column: ChatGPT-style Interaction Panel */}
        <div className="lg:col-span-5">
          <div className="bg-dark-card rounded-2xl shadow-2xl border border-dark-border h-full min-h-[600px] flex flex-col">
            <div className="px-6 py-4 border-b border-dark-border flex items-center justify-between bg-dark-card/50 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                <h3 className="font-bold text-white">AI Mentor Chat</h3>
              </div>
              <MessageSquare className="w-5 h-5 text-gray-500" />
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {!result && !isAnalyzing && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30">
                  <div className="bg-dark-bg p-6 rounded-full border border-dark-border">
                    <Sparkles className="w-16 h-16 text-neon-green animate-sparkle" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">Ready to help</p>
                    <p className="text-sm text-gray-400 max-w-xs mx-auto">Select a mode and click "Get AI Guidance" to start our session.</p>
                  </div>
                </div>
              )}

              {isAnalyzing && (
                <div className="space-y-6">
                  {[1, 2].map(i => (
                    <div key={i} className="flex gap-4">
                      <div className="w-8 h-8 rounded-lg bg-dark-border animate-pulse shrink-0" />
                      <div className="flex-1 space-y-3">
                        <div className="h-3 bg-dark-border rounded w-1/4 animate-pulse" />
                        <div className="h-3 bg-dark-border rounded w-full animate-pulse" />
                        <div className="h-3 bg-dark-border rounded w-5/6 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {result && (
                <div className="space-y-8">
                  {/* Chat History */}
                  <div className="space-y-6">
                    {chatMessages.map((msg, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                          "flex gap-4",
                          msg.role === 'user' ? "flex-row-reverse" : ""
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          msg.role === 'user' ? "bg-neon-green/20" : "bg-dark-border"
                        )}>
                          {msg.role === 'user' ? <UserIcon className="w-4 h-4 text-neon-green" /> : <Sparkles className="w-4 h-4 text-neon-green" />}
                        </div>
                        <div className={cn(
                          "p-4 rounded-2xl text-sm max-w-[85%] leading-relaxed",
                          msg.role === 'user' ? "bg-neon-green/10 text-neon-green border border-neon-green/20" : "bg-dark-bg text-gray-300 border border-dark-border"
                        )}>
                          <p className="whitespace-pre-wrap">{msg.parts[0].text}</p>
                        </div>
                      </motion.div>
                    ))}
                    {isChatting && (
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-lg bg-dark-border flex items-center justify-center shrink-0">
                          <Loader2 className="w-4 h-4 text-neon-green animate-spin" />
                        </div>
                        <div className="bg-dark-bg border border-dark-border p-4 rounded-2xl">
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-neon-green rounded-full animate-bounce" />
                            <div className="w-1.5 h-1.5 bg-neon-green rounded-full animate-bounce [animation-delay:0.2s]" />
                            <div className="w-1.5 h-1.5 bg-neon-green rounded-full animate-bounce [animation-delay:0.4s]" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Analysis Details (Collapsible or just appended) */}
                  <div className="pt-8 border-t border-dark-border space-y-8">
                    {result.bugs && result.bugs.length > 0 && (
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
                          <Bug className="w-4 h-4 text-red-400" />
                        </div>
                        <div className="space-y-4 flex-1">
                          <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest">Bug Report</h4>
                          {result.bugs.map((bug, i) => (
                            <div key={i} className="bg-dark-bg border border-red-500/20 p-4 rounded-xl space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-red-400">Line {bug.line}</span>
                              </div>
                              <p className="text-sm text-gray-400">{bug.description}</p>
                              <div className="bg-black/50 p-3 rounded-lg border border-dark-border font-mono text-xs text-neon-green overflow-x-auto">
                                {bug.fix}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.hints && result.hints.length > 0 && (
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                          <Lightbulb className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="space-y-3 flex-1">
                          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-widest">Smart Hints</h4>
                          {result.hints.map((hint, i) => (
                            <div key={i} className="bg-dark-bg border border-amber-500/10 p-4 rounded-xl text-sm text-gray-300">
                              {hint}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.learningPath && result.learningPath.length > 0 && (
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                          <GraduationCap className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="space-y-4 flex-1">
                          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Roadmap</h4>
                          <div className="space-y-3">
                            {result.learningPath.map((step, i) => (
                              <div key={i} className="flex items-start gap-3 bg-dark-bg border border-emerald-500/10 p-4 rounded-xl">
                                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-400 shrink-0 mt-0.5">
                                  {i + 1}
                                </div>
                                <p className="text-sm text-gray-300">{step}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {result.interviewQuestions && result.interviewQuestions.length > 0 && (
                      <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
                          <Briefcase className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="space-y-4 flex-1">
                          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Interview Prep</h4>
                          {result.interviewQuestions.map((q, i) => (
                            <div key={i} className="bg-dark-bg border border-indigo-500/20 p-4 rounded-xl space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full">
                                  {q.difficulty}
                                </span>
                              </div>
                              <p className="text-sm text-gray-300 font-medium">{q.question}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            {result && (
              <div className="p-4 border-t border-dark-border bg-dark-card/50">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="Ask a follow-up question..."
                    className="flex-1 bg-dark-bg border border-dark-border text-white px-4 py-2 rounded-xl text-sm focus:ring-2 focus:ring-neon-green outline-none"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    disabled={isChatting}
                  />
                  <button 
                    type="submit"
                    disabled={!chatInput.trim() || isChatting}
                    className="bg-neon-green text-black px-4 py-2 rounded-xl font-bold text-sm hover:bg-neon-green/90 transition-all disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const HistoryPage = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mentorApi.getHistory().then(data => {
      setHistory(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <History className="w-8 h-8 text-neon-green" />
        <h2 className="text-3xl font-bold text-white">Learning History</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-neon-green" /></div>
      ) : history.length === 0 ? (
        <div className="text-center py-12 bg-dark-card rounded-2xl border border-dashed border-dark-border">
          <p className="text-gray-500">No history found. Start analyzing code to see it here!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-dark-card p-6 rounded-2xl shadow-sm border border-dark-border hover:border-neon-green/30 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-neon-green/10 text-neon-green text-xs font-bold rounded-full uppercase tracking-wider">
                    {item.mode}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="bg-dark-bg p-4 rounded-lg mb-4 font-mono text-xs text-gray-400 max-h-32 overflow-hidden relative border border-dark-border">
                <pre>{item.code}</pre>
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-dark-bg to-transparent"></div>
              </div>
              <Link 
                to="/dashboard" 
                className="text-neon-green text-sm font-bold flex items-center gap-1 hover:underline"
                onClick={() => {
                  localStorage.setItem('temp_code', item.code);
                }}
              >
                Re-open in Editor <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- App ---

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-dark-bg font-sans text-white">
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};
