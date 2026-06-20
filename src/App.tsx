import React, { useState, useEffect, FormEvent } from 'react';
import { Activity, Flame, Cpu, Zap, TrendingUp, PlusCircle, CheckCircle2, User, ShieldAlert, Lock, Mail, ExternalLink, X, Layers } from 'lucide-react';

interface Task {
  id: string;
  creator_id: string;
  title: string;
  tool: string;
  mass: number;
  bounty: number;
  timestamp: string;
  status: 'active' | 'zero-g';
  animating?: boolean;
}

interface Solution {
  id: string;
  task_id: string;
  task_title: string;
  creator_id: string;
  solver_id: string;
  solver_username: string;
  proof_link: string;
  explanation: string;
  status: string;
  created_at: string;
}

interface UserSession {
  isAuthenticated: boolean;
  user: {
    id: string;
    username: string;
    email: string;
    token_balance: number;
  } | null;
}

// Change this URL to your live Render backend URL once deployed!
const BACKEND_URL = "http://localhost:5000"; 

export default function App() {
  // Authentication States
  const [session, setSession] = useState<UserSession>({ isAuthenticated: false, user: null });
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // App Dashboard States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [titleInput, setTitleInput] = useState('');
  const [toolInput, setToolInput] = useState('Make.com');
  const [massInput, setMassInput] = useState(5);
  const [bountyInput, setBountyInput] = useState(100);
  const [auditLog, setAuditLog] = useState<string[]>([]);

  // Resolution Pipeline States
  const [leftPanelMode, setLeftPanelMode] = useState<'deploy' | 'review'>('deploy');
  const [pendingSolutions, setPendingSolutions] = useState<Solution[]>([]);
  const [isSolveModalOpen, setIsSolveModalOpen] = useState(false);
  const [selectedTaskForSolve, setSelectedTaskForSolve] = useState<Task | null>(null);
  const [proofLinkInput, setProofLinkInput] = useState('');
  const [explanationInput, setExplanationInput] = useState('');

  // Check for existing session token on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("antigravity_user");
    const token = localStorage.getItem("antigravity_token");
    if (savedUser && token) {
      setSession({ isAuthenticated: true, user: JSON.parse(savedUser) });
    }
  }, []);

  // Fetch Pending Solutions whenever the review tab is opened
  useEffect(() => {
    if (leftPanelMode === 'review' && session.isAuthenticated && session.user) {
      fetch(`${BACKEND_URL}/api/solutions/pending/${session.user.id}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setPendingSolutions(data);
        })
        .catch(err => console.error("Error fetching pending solutions:", err));
    }
  }, [leftPanelMode, session.isAuthenticated, session.user]);

  // Authentication network handler
  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    const endpoint = isLoginTab ? `${BACKEND_URL}/api/auth/login` : `${BACKEND_URL}/api/auth/register`;
    const payload = isLoginTab 
      ? { email: authEmail, password: authPassword }
      : { username: authUsername, email: authEmail, password: authPassword };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Authentication operation failed.');
      }

      // If successful, save parameters to web state storage
      localStorage.setItem("antigravity_token", data.token);
      localStorage.setItem("antigravity_user", JSON.stringify(data.user));
      setSession({ isAuthenticated: true, user: data.user });
    } catch (err: any) {
      setAuthError(err.message || 'Server connection error.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("antigravity_token");
    localStorage.removeItem("antigravity_user");
    setSession({ isAuthenticated: false, user: null });
  };

  const handleDeployTask = (e: FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim() || titleInput.length < 10) {
      alert("Error: Specification logs must be at least 10 characters long.");
      return;
    }

    const newTask: Task = {
      id: `task-${Date.now()}`,
      creator_id: session.user?.id || 'unknown',
      title: titleInput,
      tool: toolInput,
      mass: massInput,
      bounty: bountyInput,
      timestamp: new Date().toISOString(),
      status: 'active'
    };

    setTasks([newTask, ...tasks]);
    setTitleInput('');
  };

  const handleInjectLiftClick = (task: Task) => {
    setSelectedTaskForSolve(task);
    setIsSolveModalOpen(true);
  };

  const handleSolutionSubmit = async () => {
    if (!selectedTaskForSolve || !session.user || !proofLinkInput || !explanationInput) return;
    
    try {
      const payload = {
        task_id: selectedTaskForSolve.id,
        task_title: selectedTaskForSolve.title,
        creator_id: selectedTaskForSolve.creator_id,
        solver_id: session.user.id,
        solver_username: session.user.username,
        proof_link: proofLinkInput,
        explanation: explanationInput
      };

      await fetch(`${BACKEND_URL}/api/solutions/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // Clear the card from view
      setTasks(tasks.filter(t => t.id !== selectedTaskForSolve.id));
      setAuditLog([`[TRANSMITTED] Solution proof dispatched into matrix for review by node creator.`, ...auditLog]);
      
      // Clean up modal state
      setIsSolveModalOpen(false);
      setSelectedTaskForSolve(null);
      setProofLinkInput('');
      setExplanationInput('');
    } catch (err) {
      console.error(err);
      alert("System failure: Unable to transmit solution.");
    }
  };

  const handleVerifySolution = async (solution: Solution) => {
    if (!session.user) return;
    
    // We send a default 100 token bounty if the task object isn't locally tracked in this session state. 
    // In a fully persistent environment, the exact bounty amount would be passed down via the task query.
    const transferAmount = 100;

    try {
      const res = await fetch(`${BACKEND_URL}/api/solutions/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solution_id: solution.id,
          task_id: solution.task_id,
          creator_id: solution.creator_id,
          solver_id: solution.solver_id,
          bounty_amount: transferAmount
        })
      });

      if (!res.ok) throw new Error("Transaction verification rejected.");

      // Sync local UI balances safely
      setSession({
        ...session,
        user: { ...session.user, token_balance: Math.max(0, session.user.token_balance - transferAmount) }
      });
      
      // Clear pending card
      setPendingSolutions(pendingSolutions.filter(s => s.id !== solution.id));
      setAuditLog([`[VERIFIED] Transferred ${transferAmount} credits to ${solution.solver_username} for task fix.`, ...auditLog]);
    } catch (err) {
      console.error(err);
      alert("Failed to execute token transaction.");
    }
  };

  const handleRejectSolution = (solutionId: string) => {
    setPendingSolutions(pendingSolutions.filter(s => s.id !== solutionId));
    setAuditLog([`[REJECTED] Solution proof rejected. Open queue stream allocation freed.`, ...auditLog]);
  };

  // If unauthenticated, intercept execution views with Authentication Modal Layout Container
  if (!session.isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 font-mono select-none relative text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00FFCC]/5 via-black to-black pointer-events-none opacity-80 z-0"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAiLz4KPHJlY3Qgd2lkdGg9IjEiIGhlaWdodD0iNCIgZmlsbD0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAyKSIvPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSIxIiBmaWxsPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDIpIi8+Cjwvc3ZnPg==')] z-0 pointer-events-none opacity-50"></div>
        
        <div className="w-full max-w-md bg-[#0B0F17] border border-gray-800 rounded-2xl p-8 flex flex-col gap-6 relative shadow-[0_0_50px_rgba(0,255,204,0.05)] z-10 animate-fade-in">
          <div className="flex items-center gap-2 justify-center mb-2">
            <div className="h-3 w-3 rounded-full bg-[#00FFCC] animate-pulse" />
            <span className="text-xl font-bold tracking-widest">ANTIGRAVITY // AUTH</span>
          </div>

          <div className="grid grid-cols-2 border-b border-gray-800">
            <button 
              onClick={() => { setIsLoginTab(true); setAuthError(''); }}
              className={`pb-3 text-center text-sm font-bold tracking-wider uppercase transition-colors ${isLoginTab ? 'text-[#00FFCC] border-b-2 border-[#00FFCC]' : 'text-gray-500 hover:text-white'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setIsLoginTab(false); setAuthError(''); }}
              className={`pb-3 text-center text-sm font-bold tracking-wider uppercase transition-colors ${!isLoginTab ? 'text-[#00FFCC] border-b-2 border-[#00FFCC]' : 'text-gray-500 hover:text-white'}`}
            >
              Register Node
            </button>
          </div>

          {authError && (
            <div className="bg-red-950/40 border border-red-800 rounded-lg p-3 text-xs text-red-400 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
            {!isLoginTab && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400 tracking-wider">HANDLE USERNAME</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-600" />
                  <input 
                    type="text" 
                    required
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    placeholder="e.target.developer"
                    className="w-full bg-black border border-gray-800 focus:border-[#00FFCC] text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none text-sm"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 tracking-wider">EMAIL MATRIX LINK</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-600" />
                <input 
                  type="email" 
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="name@matrix.com"
                  className="w-full bg-black border border-gray-800 focus:border-[#00FFCC] text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400 tracking-wider">ACCESS CODE PASSWORD</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-600" />
                <input 
                  type="password" 
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black border border-gray-800 focus:border-[#00FFCC] text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none text-sm"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={authLoading}
              className="w-full bg-[#00FFCC] text-black font-bold uppercase tracking-wider py-3 mt-2 rounded-lg hover:bg-white active:scale-95 transition-all cursor-pointer text-sm disabled:opacity-50 glow-on-hover shadow-[0_0_15px_rgba(0,255,204,0.2)]"
            >
              {authLoading ? "SYNCHRONIZING..." : isLoginTab ? "AUTHENTICATE CORE" : "INITIALIZE NODE"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 flex flex-col gap-6 font-mono select-none tracking-tight overflow-x-hidden relative">
      
      {/* Absolute Resolution Overlay Modal Container */}
      {isSolveModalOpen && selectedTaskForSolve && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-lg bg-[#0B0F17] border border-gray-800 rounded-xl p-6 shadow-[0_0_50px_rgba(0,255,204,0.1)] flex flex-col gap-5 relative">
            <button onClick={() => setIsSolveModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white cursor-pointer transition-colors">
              <X size={18} />
            </button>
            
            <div className="flex items-center gap-2 text-[#00FFCC] font-bold border-b border-gray-800 pb-3">
              <Zap size={20} className="animate-pulse" />
              <span className="tracking-widest">SUBMIT WORKFLOW CORRECTION NODE</span>
            </div>

            <div className="flex flex-col gap-1 text-xs bg-black p-3 rounded-lg border border-gray-900">
              <span className="text-gray-500 uppercase tracking-widest">Targeting Task Profile:</span>
              <span className="text-white font-mono break-words">{selectedTaskForSolve.title}</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-400 tracking-widest uppercase">Proof URL Link</label>
              <input 
                type="url" 
                value={proofLinkInput}
                onChange={(e) => setProofLinkInput(e.target.value)}
                placeholder="e.g., Loom capture url, GitHub Gist snippet snippet, or repository branch link"
                className="w-full bg-black border border-gray-800 focus:border-[#00FFCC] text-white rounded-lg p-3 text-xs focus:outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-400 tracking-widest uppercase">Technical Fix Explanation Specification</label>
              <textarea 
                rows={4}
                value={explanationInput}
                onChange={(e) => setExplanationInput(e.target.value)}
                placeholder="Break down the configuration change or code adjustment made to bypass this error log exception..."
                className="w-full bg-black border border-gray-800 focus:border-[#00FFCC] text-white rounded-lg p-3 text-xs focus:outline-none leading-relaxed resize-none transition-colors"
              />
            </div>

            <div className="flex justify-between items-center mt-2 gap-4">
              <button onClick={() => setIsSolveModalOpen(false)} className="text-xs text-gray-500 hover:text-white font-bold tracking-wider uppercase cursor-pointer px-2">CANCEL</button>
              <button 
                onClick={handleSolutionSubmit} 
                className="flex-1 bg-[#00FFCC] text-black font-bold text-xs uppercase tracking-wider py-3.5 rounded-lg hover:bg-white active:scale-95 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,255,204,0.15)] glow-on-hover"
              >
                TRANSMIT RESOLUTION INTO MATRIX
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upper Global Telemetry Bar */}
      <header className="border-b border-gray-900 bg-black pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight text-white">AntiGravity</span>
            <div className="h-2 w-2 rounded-full bg-[#00FFCC] animate-pulse shadow-[0_0_8px_#00FFCC]" />
          </div>
          <p className="text-xs text-gray-400 mt-1">Lifting the heavy weight of AI tool bloat and automation exceptions.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="bg-[#0B0F17] border border-red-900/40 px-3 py-2 rounded-lg flex items-center gap-2 text-red-400">
            <Flame className="h-4 w-4" />
            <span>BURNOUT INDEX: 84% [CRITICAL]</span>
          </div>
          <div className="bg-[#0B0F17] border border-gray-800 px-3 py-2 rounded-lg flex items-center gap-2 text-gray-300">
            <User className="h-4 w-4 text-[#00FFCC]" />
            <span className="uppercase text-white font-bold">{session.user?.username}</span>
            <span className="text-gray-500">|</span>
            <span className="text-[#00FFCC]">⟠ {session.user?.token_balance} CREDITS</span>
          </div>
          <button 
            onClick={handleLogout}
            className="border border-red-800 hover:bg-red-950/30 text-red-400 px-3 py-2 rounded-lg transition-colors cursor-pointer"
          >
            DISCONNECT
          </button>
        </div>
      </header>

      {/* Main Grid View Dashboard Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* THE CREATOR VERIFICATION HUB / LEFT COLUMN CONTAINER */}
        <div className="lg:col-span-4 flex flex-col gap-5 sticky top-6">
          <div className="flex border-b border-gray-800">
            <button 
              onClick={() => setLeftPanelMode('deploy')}
              className={`flex-1 pb-3 text-center text-[10px] font-bold tracking-widest uppercase transition-colors ${leftPanelMode === 'deploy' ? 'text-[#00FFCC] border-b-2 border-[#00FFCC]' : 'text-gray-500 hover:text-white'}`}
            >
              Deploy Roadblock
            </button>
            <button 
              onClick={() => setLeftPanelMode('review')}
              className={`flex-1 pb-3 text-center text-[10px] font-bold tracking-widest uppercase transition-colors ${leftPanelMode === 'review' ? 'text-[#00FFCC] border-b-2 border-[#00FFCC]' : 'text-gray-500 hover:text-white'}`}
            >
              Review Submissions
            </button>
          </div>

          {leftPanelMode === 'deploy' ? (
            <form onSubmit={handleDeployTask} className="bg-[#0B0F17] border border-gray-800 rounded-xl p-6 flex flex-col gap-5 animate-fade-in shadow-xl">
              <div className="flex items-center gap-2 text-sm font-bold border-b border-gray-800 pb-3">
                <PlusCircle className="h-4 w-4 text-[#00FFCC]" />
                <span className="tracking-wider">ADD ROADBLOCK TO STREAM</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 tracking-widest uppercase">TECHNICAL ROADBLOCK SPECIFICATION</label>
                <textarea 
                  rows={3}
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="Describe the exact parsing error or API timeout bottleneck..."
                  className="w-full bg-black border border-gray-800 focus:border-[#00FFCC] text-white rounded-lg p-3 focus:outline-none text-xs leading-relaxed transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 tracking-widest uppercase">TARGET ARCHITECTURE LAYER</label>
                <select 
                  value={toolInput}
                  onChange={(e) => setToolInput(e.target.value)}
                  className="w-full bg-black border border-gray-800 focus:border-[#00FFCC] text-white rounded-lg p-2.5 focus:outline-none text-xs transition-colors cursor-pointer"
                >
                  {['Make.com', 'OpenAI API', 'Zapier', 'Cursor', 'v0 by Vercel', 'n8n', 'LangChain', 'Other'].map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <label className="text-gray-400 tracking-widest uppercase text-[10px]">FRICTION MASS VALUE</label>
                  <span className={massInput >= 7 ? 'text-red-400 font-bold' : 'text-cyan-400'}>{massInput} / 10</span>
                </div>
                <input 
                  type="range" min="1" max="10" 
                  value={massInput}
                  onChange={(e) => setMassInput(Number(e.target.value))}
                  className="w-full accent-[#00FFCC] bg-black h-1 rounded cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 tracking-widest uppercase">CREDIT BOUNTY STAKE (⟠)</label>
                <input 
                  type="number" 
                  value={bountyInput}
                  onChange={(e) => setBountyInput(Number(e.target.value))}
                  className="w-full bg-black border border-gray-800 focus:border-[#00FFCC] text-white rounded-lg p-2.5 focus:outline-none text-xs transition-colors"
                />
              </div>

              <button type="submit" className="w-full bg-[#00FFCC] text-black font-bold uppercase py-3.5 rounded-lg text-xs tracking-wider border border-transparent hover:bg-white active:scale-95 transition-all cursor-pointer glow-on-hover shadow-[0_0_15px_rgba(0,255,204,0.1)]">
                DEPLOY TO STREAM MATRIX
              </button>
            </form>
          ) : (
            <div className="bg-[#0B0F17] border border-gray-800 rounded-xl p-4 flex flex-col gap-4 max-h-[600px] overflow-y-auto animate-fade-in shadow-xl">
              <div className="flex items-center gap-2 text-sm font-bold border-b border-gray-800 pb-3">
                <CheckCircle2 className="h-4 w-4 text-[#00FFCC]" />
                <span className="tracking-wider text-gray-200">PENDING NODES</span>
              </div>
              
              {pendingSolutions.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-8 italic">No pending submissions found for your active nodes.</p>
              ) : (
                pendingSolutions.map(sol => (
                  <div key={sol.id} className="border border-gray-800 hover:border-gray-700 transition-colors rounded-lg p-4 bg-black flex flex-col gap-3 shadow-lg group">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest bg-gray-900 border border-gray-800 px-2 py-1 rounded">Target: {sol.task_title}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <User className="h-3.5 w-3.5 text-[#00FFCC]" />
                        <span className="text-white font-bold">{sol.solver_username}</span>
                      </div>
                      <a href={sol.proof_link} target="_blank" rel="noreferrer" className="text-[10px] tracking-wider text-blue-400 hover:text-blue-300 flex items-center gap-1 uppercase font-bold transition-colors">
                        <ExternalLink className="h-3 w-3" /> Inspect Proof
                      </a>
                    </div>
                    
                    <p className="text-[11px] text-gray-300 bg-[#0B0F17] p-2.5 rounded border border-gray-900 font-mono leading-relaxed break-words">
                      {sol.explanation}
                    </p>
                    
                    <div className="flex gap-2 mt-1">
                      <button 
                        onClick={() => handleVerifySolution(sol)} 
                        className="flex-1 bg-[#00FFCC] text-black font-bold text-[9px] tracking-widest uppercase py-2.5 rounded-lg hover:bg-white transition-colors cursor-pointer"
                      >
                        VERIFY & TRANSFER FUNDS
                      </button>
                      <button 
                        onClick={() => handleRejectSolution(sol.id)} 
                        className="flex-1 border border-red-900 text-red-500 font-bold text-[9px] tracking-widest uppercase py-2.5 rounded-lg hover:bg-red-950/40 hover:border-red-800 transition-colors cursor-pointer"
                      >
                        REJECT SOLUTION
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right Active Ticket Stream */}
        <main className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-gray-800 pb-3 mb-2">
            <Layers className="h-4 w-4 text-[#00FFCC]" />
            <span className="text-sm font-bold tracking-widest">THE OPEN MASS ACTIVE STREAM FEED</span>
          </div>

          {tasks.length === 0 ? (
            <div className="border border-dashed border-gray-800 rounded-xl p-12 flex flex-col items-center justify-center text-center gap-3 bg-[#0B0F17]/30 shadow-inner">
              <Cpu className="h-8 w-8 text-gray-600 animate-pulse" />
              <p className="text-xs text-gray-400 tracking-wider">Stream queue cleared. System floating at zero gravity.</p>
            </div>
          ) : (
            tasks.map(task => (
              <div 
                key={task.id}
                className={`bg-[#0B0F17] border rounded-xl p-5 flex flex-col gap-4 transition-all duration-500 transform ${task.animating ? 'opacity-0 -translate-y-12 scale-95 pointer-events-none' : 'border-gray-800 hover:border-gray-700 shadow-lg'}`}
              >
                <div className="flex justify-between items-start gap-4">
                  <span className="bg-black text-[#00FFCC] border border-[#00FFCC]/20 text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wider uppercase">
                    {task.tool}
                  </span>
                  <span className="text-xs text-[#00FFCC] font-bold font-mono bg-[#00FFCC]/10 border border-[#00FFCC]/20 px-3 py-1 rounded">
                    ⟠ {task.bounty} CREDITS
                  </span>
                </div>

                <p className="text-xs text-gray-200 leading-relaxed font-mono">{task.title}</p>

                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mt-2">
                  <div className="flex items-center gap-3 w-full sm:max-w-[40%]">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Mass {task.mass}</span>
                    <div className="flex-1 bg-gray-950 h-1.5 rounded-full overflow-hidden border border-gray-800">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${task.mass >= 7 ? 'bg-red-500 shadow-[0_0_8px_#EF4444]' : 'bg-cyan-400 shadow-[0_0_8px_#22D3EE]'}`}
                        style={{ width: `${task.mass * 10}%` }}
                      />
                    </div>
                  </div>

                  <button 
                    onClick={() => handleInjectLiftClick(task)}
                    className="self-end bg-transparent border border-[#00FFCC]/30 hover:bg-[#00FFCC]/10 hover:border-[#00FFCC] text-[#00FFCC] px-4 py-2.5 rounded-lg text-[10px] tracking-widest font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 w-full sm:w-auto"
                  >
                    <Zap className="h-3 w-3 fill-current" />
                    INJECT LIFT
                  </button>
                </div>
              </div>
            ))
          )}
        </main>
      </div>

      {/* Baseline System Analytics Logs History Tray */}
      <footer className="mt-auto pt-6 border-t border-gray-900 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 tracking-widest uppercase">
          <Activity className="h-4 w-4" />
          <span>ZERO-G ENVIRONMENT OPERATIONAL ANALYSIS TICKER</span>
        </div>
        <div className="h-28 bg-black/50 border border-gray-900 rounded-lg p-3 overflow-y-auto flex flex-col gap-1.5 text-[11px] font-mono text-gray-500 select-text shadow-inner custom-scrollbar">
          {auditLog.length === 0 ? (
            <span className="text-gray-700 italic">Waiting for live platform state mutations...</span>
          ) : (
            auditLog.map((log, idx) => (
              <div key={idx} className="flex gap-2 animate-fade-in">
                <span className="text-[#00FFCC] font-bold">[STABLE]</span>
                <span className="text-gray-400">{log}</span>
              </div>
            ))
          )}
        </div>
      </footer>
    </div>
  );
}
