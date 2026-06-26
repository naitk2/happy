import { useState, useEffect, useRef, type FormEvent } from 'react';
import { Activity, Cpu, Zap, PlusCircle, CheckCircle2, User, ShieldAlert, Lock, Mail, ExternalLink, X, Layers, Briefcase, Calendar, MapPin, Code2, Rocket, Flag, Globe, AtSign, Trophy, Clock } from 'lucide-react';

interface Task {
  id: string;
  creator_id: string;
  title: string;
  tool: string;
  mass: number;
  bounty: number;
  timestamp: string;
  status: 'active' | 'zero-g';
  screenshotUrl?: string;
  animating?: boolean;
}

interface Solution {
  id: string;
  taskId: string;
  solverId: number;
  solverUsername: string;
  proofUrl: string;
  explanation: string;
  status: 'pending' | 'accepted';
  bounty: number;
}

interface SystemHistory {
  id: number;
  user_id: number;
  action_type: string;
  description: string;
  bounty_snapshot: number;
  created_at: string;
}

interface UserSession {
  isAuthenticated: boolean;
  user: {
    id: number;
    username: string;
    email: string;
    token_balance: number;
  } | null;
}

interface UserStats {
  id: number;
  username: string;
  token_balance: number;
}

type ViewState = 'home' | 'about' | 'matrix' | 'leaderboard' | 'history';

const BACKEND_URL = "https://antigravity-backend-o17a.onrender.com";

interface VerifierProps {
  onVerify: () => void;
  onCancel: () => void;
}

function AntiGravityVerifier({ onVerify, onCancel }: VerifierProps) {
  const [angle, setAngle] = useState(120);
  const targetMin = 175;
  const targetMax = 205;
  const isAligned = angle >= targetMin && angle <= targetMax;

  return (
    <div className="flex flex-col gap-5 bg-black border border-gray-800 rounded-xl p-6 shadow-inner w-full font-mono text-white relative">
      <div className="flex items-center justify-between border-b border-gray-900 pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-[#00FFCC] animate-pulse" />
          <span className="text-[10px] font-bold tracking-widest uppercase">ANTI-GRAVITY VECTOR VERIFICATION</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 py-2">
        {/* Orbital SVG Graph */}
        <div className="relative w-36 h-36 border border-gray-800 rounded-full flex items-center justify-center bg-[#05070A]">
          {/* Target Orbit Region */}
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="72"
              cy="72"
              r="55"
              fill="none"
              stroke="#1F2937"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {/* Draw target arc */}
            <circle
              cx="72"
              cy="72"
              r="55"
              fill="none"
              stroke="#00FFCC"
              strokeWidth="4"
              strokeDasharray={`${(targetMax - targetMin) * (2 * Math.PI * 55) / 360} 400`}
              transform={`rotate(${targetMin - 90}, 72, 72)`}
              className="opacity-40"
            />
          </svg>

          {/* Draggable/Animated Node */}
          {(() => {
            const rad = (angle - 90) * Math.PI / 180;
            const x = 72 + 55 * Math.cos(rad);
            const y = 72 + 55 * Math.sin(rad);
            return (
              <div 
                className={`absolute w-3.5 h-3.5 rounded-full transition-shadow duration-150 ${isAligned ? 'bg-[#00FFCC] shadow-[0_0_12px_#00FFCC] animate-ping' : 'bg-gray-600'}`}
                style={{ left: `${x - 7}px`, top: `${y - 7}px` }}
              />
            );
          })()}
          
          {/* Real dot showing positioning */}
          {(() => {
            const rad = (angle - 90) * Math.PI / 180;
            const x = 72 + 55 * Math.cos(rad);
            const y = 72 + 55 * Math.sin(rad);
            return (
              <div 
                className={`absolute w-3 h-3 rounded-full border border-black transition-colors duration-150 ${isAligned ? 'bg-[#00FFCC] shadow-[0_0_10px_#00FFCC]' : 'bg-gray-400'}`}
                style={{ left: `${x - 6}px`, top: `${y - 6}px` }}
              />
            );
          })()}

          <div className="flex flex-col items-center justify-center z-10 text-center gap-1">
            <span className="text-[9px] text-gray-500 uppercase tracking-widest">Alignment</span>
            <span className={`text-xs font-bold font-mono ${isAligned ? 'text-[#00FFCC]' : 'text-gray-400'}`}>
              {angle}°
            </span>
          </div>
        </div>

        <div className="w-full flex flex-col gap-1">
          <div className="flex justify-between text-[9px] text-gray-500 tracking-wider">
            <span>VECTOR PHASE</span>
            <span className={isAligned ? 'text-[#00FFCC] font-bold' : 'text-gray-400'}>
              {isAligned ? 'VECTOR ALIGNED' : 'DE-ALIGNED'}
            </span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="360" 
            value={angle} 
            onChange={(e) => setAngle(Number(e.target.value))} 
            className="w-full accent-[#00FFCC] bg-black h-1 rounded cursor-pointer"
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end mt-1 text-xs">
        <button 
          onClick={onCancel}
          className="text-gray-500 hover:text-white uppercase font-bold tracking-wider px-2 cursor-pointer"
        >
          Cancel
        </button>
        <button 
          onClick={onVerify}
          disabled={!isAligned}
          className="flex-1 bg-[#00FFCC] text-black font-mono tracking-widest font-bold text-xs uppercase py-2.5 rounded-lg hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,255,204,0.1)] cursor-pointer"
        >
          [ AUTHORIZE SIGNATURE ]
        </button>
      </div>
    </div>
  );
}

export default function App() {
  // Navigation State
  const [activeView, setActiveView] = useState<ViewState>('home');

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
  const [auditLog, setAuditLog] = useState<SystemHistory[]>([]);
  const [leaderboard, setLeaderboard] = useState<UserStats[]>([]);

  // Resolution Pipeline Local States
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [leftPanelMode, setLeftPanelMode] = useState<'deploy' | 'review'>('deploy');
  
  // Deploy Dropzone States
  const [deployScreenshotUrl, setDeployScreenshotUrl] = useState('');

  // Modal Controlled States
  const [isSolveModalOpen, setIsSolveModalOpen] = useState(false);
  const [activeTaskForFix, setActiveTaskForFix] = useState<Task | null>(null);
  const [proofUrlInput, setProofUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [explanationInput, setExplanationInput] = useState('');

  // Zoom Overlay States
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Verification States
  const [showAuthVerifier, setShowAuthVerifier] = useState(false);
  const [showSolveVerifier, setShowSolveVerifier] = useState(false);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/tasks`);
      if (res.ok) {
        const data = await res.json();
        const mappedTasks = data.map((t: any) => ({
          id: t.id,
          creator_id: String(t.creator_id),
          title: t.title,
          tool: t.tool,
          mass: t.mass,
          bounty: t.bounty,
          timestamp: t.created_at,
          status: t.status,
          screenshotUrl: t.screenshot_url || undefined
        }));
        setTasks(mappedTasks);
      }
    } catch (e) {
      console.error("Failed to fetch tasks:", e);
    }
  };

  const fetchPendingSolutions = async (userId: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/solutions/pending/${userId}`);
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((s: any) => ({
          id: String(s.id),
          taskId: s.task_id,
          solverId: s.solver_id,
          solverUsername: s.solver_username,
          proofUrl: s.proof_link,
          explanation: s.explanation,
          status: s.status,
          bounty: s.bounty
        }));
        setSolutions(mapped);
      }
    } catch (e) {
      console.error("Failed to fetch pending solutions:", e);
    }
  };

  const fetchHistory = async (userId: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/history/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setAuditLog(data);
      }
    } catch (e) {
      console.error(e);
    }
  };



  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/leaderboard`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Track balance changes to trigger floating animation
  const prevBalanceRef = useRef<number | null>(null);
  const [creditChange, setCreditChange] = useState<{ amount: number; type: 'add' | 'less'; id: number } | null>(null);

  useEffect(() => {
    if (session.user) {
      const currentBalance = session.user.token_balance;
      if (prevBalanceRef.current !== null && prevBalanceRef.current !== currentBalance) {
        const diff = currentBalance - prevBalanceRef.current;
        if (diff !== 0) {
          setCreditChange({
            amount: Math.abs(diff),
            type: diff > 0 ? 'add' : 'less',
            id: Date.now()
          });
        }
      }
      prevBalanceRef.current = currentBalance;
    } else {
      prevBalanceRef.current = null;
    }
  }, [session.user?.token_balance]);

  useEffect(() => {
    const savedUser = localStorage.getItem("antigravity_user");
    const token = localStorage.getItem("antigravity_token");
    if (savedUser && token) {
      const user = JSON.parse(savedUser);
      setSession({ isAuthenticated: true, user });
      fetchHistory(user.id);
    }
    fetchTasks();
  }, []);

  useEffect(() => {
    if (activeView === 'matrix') {
      fetchTasks();
      if (session.user) {
        fetchHistory(session.user.id);
        fetchPendingSolutions(session.user.id);
      }
    } else if (activeView === 'leaderboard') {
      fetchLeaderboard();
    } else if (activeView === 'history' && session.user) {
      fetchHistory(session.user.id);
    }
  }, [activeView, session.user?.id]);

  useEffect(() => {
    if (leftPanelMode === 'review' && session.user) {
      fetchPendingSolutions(session.user.id);
    }
  }, [leftPanelMode, session.user?.id]);

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    if (isLoginTab) {
      setAuthLoading(true);
      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authEmail, password: authPassword })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || data.error || 'Authentication operation failed.');

        localStorage.setItem("antigravity_token", data.token);
        localStorage.setItem("antigravity_user", JSON.stringify(data.user));
        setSession({ isAuthenticated: true, user: data.user });
        
        await fetch(`${BACKEND_URL}/api/history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: data.user.id,
            action_type: 'NODE_AUTH',
            description: `Node authentication sequence approved.`,
            bounty_snapshot: data.user.token_balance
          })
        });
        fetchHistory(data.user.id);
        fetchTasks();
      } catch (err: any) {
        setAuthError(err.message || 'Server connection error.');
      } finally {
        setAuthLoading(false);
      }
    } else {
      // For registration: show verifier captcha first!
      setShowAuthVerifier(true);
    }
  };

  const executeRegister = async () => {
    setAuthError('');
    setAuthLoading(true);
    setShowAuthVerifier(false);

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUsername, email: authEmail, password: authPassword })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Authentication operation failed.');

      localStorage.setItem("antigravity_token", data.token);
      localStorage.setItem("antigravity_user", JSON.stringify(data.user));
      setSession({ isAuthenticated: true, user: data.user });
      
      await fetch(`${BACKEND_URL}/api/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: data.user.id,
          action_type: 'NODE_AUTH',
          description: `Node registration complete. Sequence approved.`,
          bounty_snapshot: data.user.token_balance
        })
      });
      fetchHistory(data.user.id);
      fetchTasks();
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

  const handleDeployTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!session.user) return;
    if (!titleInput.trim() || titleInput.length < 10) {
      alert("Error: Specification logs must be at least 10 characters long.");
      return;
    }
    if (session.user.token_balance < bountyInput) {
      alert("Error: Insufficient credits to deploy this roadblock.");
      return;
    }

    const taskId = `task-${Date.now()}`;
    const payload = {
      id: taskId,
      creator_id: session.user.id,
      title: titleInput,
      tool: toolInput,
      mass: massInput,
      bounty: bountyInput,
      screenshot_url: deployScreenshotUrl || null
    };

    try {
      const res = await fetch(`${BACKEND_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Deployment failed.");

      const updatedUser = { ...session.user, token_balance: data.newBalance };
      setSession({ ...session, user: updatedUser });
      localStorage.setItem("antigravity_user", JSON.stringify(updatedUser));

      fetchTasks();
      fetchHistory(session.user.id);

      setTitleInput('');
      setDeployScreenshotUrl('');
    } catch (err: any) {
      alert("Deployment error: " + err.message);
    }
  };

  const handleInjectLiftClick = (task: Task) => {
    setActiveTaskForFix(task);
    setIsSolveModalOpen(true);
    setShowSolveVerifier(false); // Reset solve verifier state
  };

  const handleSolutionSubmit = async () => {
    if (!activeTaskForFix || !session.user || !proofUrlInput.trim() || !explanationInput.trim()) {
      alert("Please provide a proof link along with an explanation.");
      return;
    }
    // Show verifier captcha first!
    setShowSolveVerifier(true);
  };

  const executeSolutionSubmit = async () => {
    if (!activeTaskForFix || !session.user) return;
    setIsUploading(true);
    setShowSolveVerifier(false);
    
    let finalUrl = proofUrlInput.trim();
    const payload = {
      task_id: activeTaskForFix.id,
      task_title: activeTaskForFix.title,
      creator_id: activeTaskForFix.creator_id,
      solver_id: session.user.id,
      solver_username: session.user.username,
      proof_link: finalUrl,
      explanation: explanationInput
    };

    try {
      const res = await fetch(`${BACKEND_URL}/api/solutions/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit solution.");

      // Visual animation on current tasks
      setTasks(tasks.map(t => t.id === activeTaskForFix.id ? { ...t, animating: true } : t));
      
      setTimeout(() => {
        setTasks(prev => prev.filter(t => t.id !== activeTaskForFix.id));
        if (session.user) {
          fetchHistory(session.user.id);
        }
      }, 500);

      setIsSolveModalOpen(false);
      setActiveTaskForFix(null);
      setProofUrlInput('');
      setExplanationInput('');
    } catch (err: any) {
      alert("Solution submission error: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleVerifySolution = async (solutionId: string) => {
    if (!session.user) return;
    const sol = solutions.find(s => s.id === solutionId);
    if (!sol) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/solutions/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solution_id: parseInt(sol.id),
          task_id: sol.taskId,
          creator_id: session.user.id,
          solver_id: sol.solverId,
          bounty_amount: sol.bounty
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed.");

      // Refresh solutions and history
      fetchPendingSolutions(session.user.id);
      fetchHistory(session.user.id);
    } catch (err: any) {
      alert("Verification error: " + err.message);
    }
  };

  if (!session.isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 font-mono select-none relative text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00FFCC]/5 via-black to-black pointer-events-none opacity-80 z-0"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAiLz4KPHJlY3Qgd2lkdGg9IjEiIGhlaWdodD0iNCIgZmlsbD0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAyKSIvPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSIxIiBmaWxsPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDIpIi8+Cjwvc3ZnPg==')] z-0 pointer-events-none opacity-50"></div>
        
        <div className="w-full max-w-md bg-[#0B0F17] border border-gray-800 rounded-2xl p-8 flex flex-col gap-6 relative z-10 animate-fade-in shadow-[0_0_50px_rgba(0,255,204,0.05)]">
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

          {showAuthVerifier ? (
            <AntiGravityVerifier 
              onVerify={executeRegister} 
              onCancel={() => setShowAuthVerifier(false)} 
            />
          ) : (
            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
              {!isLoginTab && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-400 tracking-wider">HANDLE USERNAME</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-600" />
                    <input type="text" required value={authUsername} onChange={(e) => setAuthUsername(e.target.value)} className="w-full bg-black border border-gray-800 focus:border-[#00FFCC] text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none text-sm" />
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400 tracking-wider">EMAIL MATRIX LINK</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-600" />
                  <input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full bg-black border border-gray-800 focus:border-[#00FFCC] text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none text-sm" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-400 tracking-wider">ACCESS CODE PASSWORD</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-600" />
                  <input type="password" required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full bg-black border border-gray-800 focus:border-[#00FFCC] text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none text-sm" />
                </div>
              </div>
              <button type="submit" disabled={authLoading} className="w-full bg-[#00FFCC] text-black font-bold uppercase tracking-wider py-3 mt-2 rounded-lg hover:bg-white active:scale-95 transition-all text-sm disabled:opacity-50 glow-on-hover shadow-[0_0_15px_rgba(0,255,204,0.2)]">
                {authLoading ? "SYNCHRONIZING..." : isLoginTab ? "AUTHENTICATE CORE" : "INITIALIZE NODE"}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // --- RENDER FUNCTIONS FOR VIEWS --- //

  const renderNavbar = () => (
    <nav className="border-b border-gray-900 bg-[#0B0F17]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex flex-col xl:flex-row justify-between items-center gap-6 shadow-[0_4px_30px_rgba(0,255,204,0.05)]">
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold tracking-tight text-white uppercase">AntiGravity Matrix</span>
        <span className="text-gray-500 text-xs hidden md:inline">// Ecosystem Node</span>
        <div className="h-2 w-2 rounded-full bg-[#00FFCC] animate-pulse shadow-[0_0_8px_#00FFCC]" />
      </div>

      <div className="flex items-center gap-6 text-[10px] sm:text-xs font-bold tracking-widest uppercase">
        <button 
          onClick={() => setActiveView('home')} 
          className={`transition-all py-1 border-b-2 ${activeView === 'home' ? 'text-[#00FFCC] border-[#00FFCC]' : 'text-gray-500 border-transparent hover:text-white'}`}
        >
          [ HOME ]
        </button>
        <button 
          onClick={() => setActiveView('matrix')} 
          className={`transition-all py-1 border-b-2 ${activeView === 'matrix' ? 'text-[#00FFCC] border-[#00FFCC]' : 'text-gray-500 border-transparent hover:text-white'}`}
        >
          [ DISCOVER ORBIT (MATRIX) ]
        </button>
        <button 
          onClick={() => setActiveView('about')} 
          className={`transition-all py-1 border-b-2 ${activeView === 'about' ? 'text-[#00FFCC] border-[#00FFCC]' : 'text-gray-500 border-transparent hover:text-white'}`}
        >
          [ ABOUT FOUNDER ]
        </button>
        <button 
          onClick={() => setActiveView('leaderboard')} 
          className={`transition-all py-1 border-b-2 flex items-center gap-1 ${activeView === 'leaderboard' ? 'text-[#00FFCC] border-[#00FFCC]' : 'text-gray-500 border-transparent hover:text-white'}`}
        >
          <Trophy className="h-3 w-3" /> [ LEADERBOARD ]
        </button>
        <button 
          onClick={() => setActiveView('history')} 
          className={`transition-all py-1 border-b-2 flex items-center gap-1 ${activeView === 'history' ? 'text-[#00FFCC] border-[#00FFCC]' : 'text-gray-500 border-transparent hover:text-white'}`}
        >
          <Clock className="h-3 w-3" /> [ HISTORY ]
        </button>
      </div>

      <div className="flex items-center gap-3 text-xs">
        <div className="relative bg-black border border-gray-800 px-3 py-2 rounded-lg flex items-center gap-2 text-gray-300">
          <User className="h-4 w-4 text-[#00FFCC]" />
          <span className="uppercase text-white font-bold">{session.user?.username}</span>
          <span className="text-gray-500">|</span>
          <span className="text-[#00FFCC] transition-all duration-300">⟠ {session.user?.token_balance} CREDITS</span>
          {creditChange && (
            <div 
              key={creditChange.id}
              className={`absolute -top-8 right-2 font-mono font-bold text-xs animate-float-up ${creditChange.type === 'add' ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}
              onAnimationEnd={() => setCreditChange(null)}
            >
              {creditChange.type === 'add' ? '+' : '-'}⟠{creditChange.amount}
            </div>
          )}
        </div>
        <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 px-2 transition-colors cursor-pointer text-[10px] tracking-widest uppercase font-bold">
          DISCONNECT
        </button>
      </div>
    </nav>
  );

  const renderHome = () => (
    <div className="flex flex-col gap-10 animate-fade-in max-w-7xl mx-auto w-full py-4">
      <div className="bg-[#0B0F17] border border-[#00FFCC]/20 rounded-2xl p-8 md:p-12 text-center flex flex-col items-center justify-center gap-6 shadow-[0_0_100px_rgba(0,255,204,0.05)] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAiLz4KPHJlY3Qgd2lkdGg9IjEiIGhlaWdodD0iNCIgZmlsbD0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAyKSIvPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSIxIiBmaWxsPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDIpIi8+Cjwvc3ZnPg==')] z-0 pointer-events-none opacity-50"></div>
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Globe className="h-12 w-12 text-[#00FFCC] animate-pulse" />
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase text-white drop-shadow-[0_0_15px_rgba(0,255,204,0.3)]">
            ANTIGRAVITY ECOSYSTEM MATRIX // OPERATIONAL NODE
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-2xl leading-relaxed tracking-wide font-mono">
            Lifting the heavy weight of AI tool bloat while fueling independent digital startups from Goa to the global cloud layout.
          </p>
          <button 
            onClick={() => setActiveView('matrix')}
            className="mt-6 bg-[#00FFCC] text-black px-8 py-4 rounded-xl font-bold tracking-widest text-[11px] uppercase hover:bg-white transition-all active:scale-95 shadow-[0_0_20px_rgba(0,255,204,0.2)] flex items-center gap-2 cursor-pointer font-mono"
          >
            <Zap className="h-4 w-4" />
            [ LAUNCH ACTIVE ENGINE STREAM ]
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
            <Briefcase className="h-5 w-5 text-[#00FFCC]" />
            <h2 className="text-sm font-bold tracking-widest uppercase">Live Startup Registry Array</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                title: 'AntiGravity Matrix',
                date: 'Active Ecosystem',
                desc: 'A micro-consulting network crowdsourcing 15-minute fixes for complex AI tool configurations and automation failures.'
              },
              {
                title: 'Diecaste',
                date: 'Founded Jan 2026',
                desc: 'A service-based business providing custom assignment writing solutions expanding rapidly into e-commerce.'
              },
              {
                title: 'The Hidden Goa Project',
                date: 'Local Tourism Engine',
                desc: 'A local digital tourism startup curation engine providing secret travel guides to off-beat locations (such as Bambolim Beach) via social media funnels.'
              }
            ].map(v => (
              <div key={v.title} className="bg-[#0B0F17] border border-gray-800 hover:border-[#00FFCC]/50 rounded-xl p-6 flex flex-col gap-4 transition-colors group">
                <div className="flex justify-between items-start">
                  <h3 className="text-[#00FFCC] font-bold tracking-widest uppercase text-sm">{v.title}</h3>
                </div>
                <span className="text-[9px] bg-black border border-gray-800 text-gray-400 px-2 py-1 rounded tracking-widest uppercase w-max">{v.date}</span>
                <p className="text-xs text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors font-mono">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
            <Activity className="h-5 w-5 text-[#00FFCC]" />
            <h2 className="text-sm font-bold tracking-widest uppercase">Local Community Feed</h2>
          </div>
          <div className="bg-[#0B0F17] border border-gray-800 rounded-xl p-6 flex flex-col gap-6">
            <div className="border-l-2 border-[#00FFCC] pl-4 flex flex-col gap-1.5">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Upcoming Event</span>
              <span className="text-sm text-white uppercase tracking-wider font-bold">Goa Hack: Sunshine Code</span>
              <span className="text-[10px] text-gray-400 tracking-wider">Susegad Sprint 2026 deployed over Devfolio</span>
            </div>
            <div className="border-l-2 border-blue-500 pl-4 flex flex-col gap-1.5">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Marketing Logs</span>
              <span className="text-sm text-white uppercase tracking-wider font-bold">U-17 Diecaste Football Champ</span>
              <span className="text-[10px] text-gray-400 tracking-wider">Hosted at the Santa Cruz football ground</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAbout = () => (
    <div className="flex flex-col gap-8 animate-fade-in max-w-6xl mx-auto w-full h-full py-4">
      <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
        <User className="h-6 w-6 text-[#00FFCC]" />
        <h1 className="text-2xl font-black tracking-widest uppercase text-white drop-shadow-[0_0_10px_rgba(0,255,204,0.3)]">
          FOUNDER PROFILE MATRICES
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 items-start">
        {/* Left Column Pane (The Dossier) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-[#0B0F17] border border-gray-800 rounded-xl p-8 flex flex-col gap-6 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <MapPin className="h-32 w-32 text-[#00FFCC]" />
            </div>
            <div className="flex flex-col gap-1 relative z-10 border-b border-gray-800 pb-4">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Identity Node</span>
              <span className="text-3xl text-white font-black tracking-widest uppercase text-[#00FFCC]">Naitik Patil</span>
            </div>


            <div className="flex flex-col gap-1 relative z-10 mt-2 border-t border-gray-800 pt-5">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Secure Comms Links</span>
              <div className="flex flex-col gap-3 mt-1">
                <a href="https://www.instagram.com/itzz_naitik_24/" target="_blank" rel="noreferrer" className="text-xs sm:text-sm text-gray-300 hover:text-[#00FFCC] font-mono flex items-center gap-3 transition-colors w-max bg-black px-3 py-2 rounded-lg border border-gray-800">
                  <AtSign className="h-4 w-4 text-[#00FFCC]" /> @itzz_naitik_24
                </a>
                <a href="mailto:naitik2patil4@gmail.com" className="text-xs sm:text-sm text-gray-300 hover:text-[#00FFCC] font-mono flex items-center gap-3 transition-colors w-max bg-black px-3 py-2 rounded-lg border border-gray-800">
                  <Mail className="h-4 w-4 text-[#00FFCC]" /> naitik2patil4@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 bg-[#0B0F17] border border-gray-800 rounded-xl p-6">
            <span className="text-[11px] font-bold text-gray-400 tracking-widest uppercase flex items-center gap-2">
              <Code2 className="h-4 w-4 text-[#00FFCC]" />
              Technical Skill Stack
            </span>
            <div className="flex flex-wrap gap-2.5">
              {['Python', 'React', 'TypeScript', 'HTML', 'CSS', 'Tailwind CSS', 'Android Studio'].map(skill => (
                <span key={skill} className="bg-black border border-[#00FFCC]/30 text-[#00FFCC] px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(0,255,204,0.05)]">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Center Column Pane (The Narrative Timeline) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <span className="text-sm font-bold text-gray-400 tracking-widest uppercase flex items-center gap-2 border-b border-gray-800 pb-3">
            <Flag className="h-5 w-5 text-[#00FFCC]" />
            The Narrative Timeline
          </span>
          <div className="flex flex-col gap-8 relative before:absolute before:inset-y-0 before:left-3.5 before:w-px before:bg-gray-800 ml-2 mt-2">
            {[
              {
                icon: <Calendar className="h-3 w-3 text-black" />,
                title: "Santa Cruz High School // 10th Standard Academic Sprint",
                date: "2026-2027 Academic Year"
              },
              {
                icon: <ShieldAlert className="h-3 w-3 text-black" />,
                title: "Naval Wing Junior Journey Complete",
                date: "Earned NCC 'A' Certificate Distinction"
              },
              {
                icon: <Rocket className="h-3 w-3 text-black" />,
                title: "Operations & Digital Automation Strategy",
                date: "Practical application building with custom API pipelines and developer web frameworks."
              }
            ].map((milestone, idx) => (
              <div key={idx} className="relative pl-12">
                <div className="absolute left-0 top-0.5 bg-[#00FFCC] h-8 w-8 rounded-full flex items-center justify-center border-4 border-black shadow-[0_0_15px_rgba(0,255,204,0.3)]">
                  {milestone.icon}
                </div>
                <div className="bg-[#0B0F17] border border-gray-800 rounded-xl p-5 flex flex-col gap-2 hover:border-[#00FFCC]/40 transition-colors shadow-lg">
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase">{milestone.title}</h3>
                  <p className="text-xs text-[#00FFCC] font-mono tracking-widest">{milestone.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Status Drawer */}
      <div className="mt-auto border-t border-gray-900 pt-5 flex items-center gap-3">
        <Activity className="h-5 w-5 text-[#00FFCC] animate-pulse" />
        <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase border border-gray-800 bg-[#0B0F17] px-3 py-1.5 rounded-md">
          [SYSTEM NODE ADVISORY]: Developer node synchronized with Goan tech ecosystem clusters.
        </span>
      </div>
    </div>
  );

  const pendingSolutionsView = solutions.filter(s => s.status === 'pending');

  const renderMatrix = () => (
    <div className="flex flex-col gap-6 animate-fade-in py-2">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* THE CREATOR INSPECTION PANEL (Review Workspace) */}
        <div className="lg:col-span-4 flex flex-col gap-5 sticky top-28">
          <div className="flex border-b border-gray-800">
            <button 
              onClick={() => setLeftPanelMode('deploy')}
              className={`flex-1 pb-3 text-center text-[10px] font-bold tracking-widest uppercase transition-colors cursor-pointer ${leftPanelMode === 'deploy' ? 'text-[#00FFCC] border-b-2 border-[#00FFCC]' : 'text-gray-500 hover:text-white'}`}
            >
              Deploy Mass
            </button>
            <button 
              onClick={() => setLeftPanelMode('review')}
              className={`flex-1 pb-3 text-center text-[10px] font-bold tracking-widest uppercase transition-colors cursor-pointer ${leftPanelMode === 'review' ? 'text-[#00FFCC] border-b-2 border-[#00FFCC]' : 'text-gray-500 hover:text-white'}`}
            >
              Review Submissions
            </button>
          </div>

          {leftPanelMode === 'deploy' ? (
            <form onSubmit={handleDeployTask} className="bg-[#0B0F17] border border-gray-800 rounded-xl p-6 flex flex-col gap-5 shadow-xl">
              <div className="flex items-center gap-2 text-sm font-bold border-b border-gray-800 pb-3">
                <PlusCircle className="h-4 w-4 text-[#00FFCC]" />
                <span className="tracking-wider uppercase">Deploy Mass Roadblock</span>
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
                <label className="text-[10px] text-gray-400 tracking-widest uppercase">ASSET LINK (GDRIVE, LOOM, IMGUR)</label>
                <input 
                  type="url"
                  value={deployScreenshotUrl}
                  onChange={(e) => setDeployScreenshotUrl(e.target.value)}
                  placeholder="Paste public link to the error screenshot or video..."
                  className="w-full bg-black border border-gray-800 focus:border-[#00FFCC] text-white rounded-lg p-3 focus:outline-none text-xs transition-colors"
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
                <input type="range" min="1" max="10" value={massInput} onChange={(e) => setMassInput(Number(e.target.value))} className="w-full accent-[#00FFCC] bg-black h-1 rounded cursor-pointer" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-gray-400 tracking-widest uppercase">CREDIT BOUNTY STAKE (⟠)</label>
                <input type="number" value={bountyInput} onChange={(e) => setBountyInput(Number(e.target.value))} className="w-full bg-black border border-gray-800 focus:border-[#00FFCC] text-white rounded-lg p-2.5 focus:outline-none text-xs transition-colors" />
              </div>

              <button type="submit" className="w-full bg-[#00FFCC] text-black font-bold uppercase py-3.5 rounded-lg text-xs tracking-wider border border-transparent hover:bg-white active:scale-95 transition-all cursor-pointer">
                DEPLOY TO STREAM MATRIX
              </button>
            </form>
          ) : (
            <div className="bg-[#0B0F17] border border-gray-800 rounded-xl p-4 flex flex-col gap-4 max-h-[600px] overflow-y-auto shadow-xl custom-scrollbar">
              <div className="flex items-center gap-2 text-sm font-bold border-b border-gray-800 pb-3">
                <CheckCircle2 className="h-4 w-4 text-[#00FFCC]" />
                <span className="tracking-wider text-gray-200">INCOMING PEER FIXES</span>
              </div>
              
              {pendingSolutionsView.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-8 italic">No incoming fixes in queue.</p>
              ) : (
                pendingSolutionsView.map(sol => {
                  const taskRef = tasks.find(t => t.id === sol.taskId);
                  return (
                    <div key={sol.id} className="border border-gray-800 rounded-lg p-4 bg-black flex flex-col gap-3 shadow-lg">
                      <div className="flex flex-col gap-1 text-[10px] text-gray-400 bg-gray-900 border border-gray-800 px-2 py-1.5 rounded break-words">
                        <span className="uppercase tracking-widest">Bug Reference:</span>
                        <span className="text-gray-300 font-mono">{taskRef ? taskRef.title : `Task ${sol.taskId}`}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs">
                          <User className="h-3.5 w-3.5 text-[#00FFCC]" />
                          <span className="text-white font-bold">{sol.solverUsername}</span>
                        </div>
                        <a href={sol.proofUrl} target="_blank" rel="noreferrer" className="text-[10px] tracking-wider text-blue-400 hover:text-blue-300 flex items-center gap-1 uppercase font-bold transition-colors">
                          <ExternalLink className="h-3 w-3" /> Inspect URL
                        </a>
                      </div>
                      
                      <p className="text-[11px] text-gray-300 bg-[#0B0F17] p-2.5 rounded border border-gray-900 font-mono leading-relaxed break-words">
                        {sol.explanation}
                      </p>
                      
                      <div className="flex gap-2 mt-1">
                        <button 
                          onClick={() => handleVerifySolution(sol.id)} 
                          className="flex-1 bg-[#00FFCC] text-black font-bold text-[9px] tracking-widest uppercase py-2.5 rounded-lg hover:bg-white transition-colors cursor-pointer"
                        >
                          [ CONFIRM & REWARD PEER NODE ]
                        </button>
                      </div>
                    </div>
                  );
                })
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
                
                {/* Visual Thumbnail */}
                {task.screenshotUrl && (
                  <img 
                    src={task.screenshotUrl} 
                    alt="Task Asset" 
                    onClick={() => setZoomedImage(task.screenshotUrl!)}
                    className="mt-3 w-full max-h-36 object-cover rounded-lg border border-gray-800 cursor-zoom-in hover:opacity-90 transition-opacity"
                  />
                )}

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
            auditLog.map((log) => (
              <div key={log.id} className="flex gap-2 animate-fade-in">
                <span className="text-[#00FFCC] font-bold">[{log.action_type}]</span>
                <span className="text-gray-400">{log.description}</span>
                <span className="text-gray-600 ml-auto">
                  ⟠ {log.bounty_snapshot} • {new Date(log.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </footer>
    </div>
  );

  const renderHistory = () => (
    <div className="flex flex-col gap-8 animate-fade-in max-w-5xl mx-auto w-full py-4">
      <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
        <Clock className="h-6 w-6 text-[#00FFCC]" />
        <h2 className="text-xl font-bold tracking-widest uppercase">Global Telemetry Log</h2>
      </div>
      <div className="bg-[#0B0F17] border border-gray-800 rounded-xl p-6 flex flex-col gap-4 shadow-xl">
        {auditLog.length === 0 ? (
          <div className="text-center py-10 text-gray-500 italic">No telemetry data found for this node.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {auditLog.map((log) => (
              <div key={log.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black border border-gray-900 p-4 rounded-lg hover:border-gray-700 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="bg-[#00FFCC]/10 p-2 rounded flex items-center justify-center mt-1">
                    <Activity className="h-4 w-4 text-[#00FFCC]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[#00FFCC] font-bold text-xs uppercase tracking-widest">[{log.action_type}]</span>
                    <span className="text-gray-300 text-sm font-mono">{log.description}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs text-gray-500 font-mono">{new Date(log.created_at).toLocaleString()}</span>
                  <span className="text-xs font-bold text-[#00FFCC] bg-[#00FFCC]/10 px-2 py-1 rounded">⟠ {log.bounty_snapshot}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderLeaderboard = () => (
    <div className="flex flex-col gap-8 animate-fade-in max-w-4xl mx-auto w-full py-4">
      <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
        <Trophy className="h-6 w-6 text-[#00FFCC]" />
        <h2 className="text-xl font-bold tracking-widest uppercase">Network Leaderboard</h2>
      </div>
      <div className="bg-[#0B0F17] border border-gray-800 rounded-xl p-6 shadow-xl flex flex-col gap-2">
        <div className="grid grid-cols-12 gap-4 pb-3 border-b border-gray-900 text-xs font-bold text-gray-500 uppercase tracking-widest px-4">
          <div className="col-span-2 text-center">Rank</div>
          <div className="col-span-6">Hacker Node</div>
          <div className="col-span-4 text-right">Net Worth</div>
        </div>
        {leaderboard.length === 0 ? (
          <div className="text-center py-10 text-gray-500 italic">Scanning network coordinates...</div>
        ) : (
          leaderboard.map((user, idx) => (
            <div key={user.id} className={`grid grid-cols-12 gap-4 items-center p-4 rounded-lg border transition-colors ${user.id === session.user?.id ? 'bg-[#00FFCC]/5 border-[#00FFCC]/50' : 'bg-black border-gray-900 hover:border-gray-800'}`}>
              <div className="col-span-2 flex justify-center">
                <span className={`text-lg font-black tracking-widest ${idx === 0 ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-amber-600' : 'text-gray-600'}`}>
                  #{idx + 1}
                </span>
              </div>
              <div className="col-span-6 flex items-center gap-3 overflow-hidden">
                <User className={`h-4 w-4 ${user.id === session.user?.id ? 'text-[#00FFCC]' : 'text-gray-600'}`} />
                <span className={`font-mono text-sm truncate ${user.id === session.user?.id ? 'text-white font-bold' : 'text-gray-400'}`}>{user.username}</span>
                {user.id === session.user?.id && <span className="text-[9px] bg-[#00FFCC] text-black font-bold px-1.5 py-0.5 rounded tracking-widest uppercase ml-2 hidden sm:inline">YOU</span>}
              </div>
              <div className="col-span-4 flex justify-end">
                <span className="text-xs sm:text-sm text-[#00FFCC] font-bold font-mono">⟠ {user.token_balance}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-mono select-none tracking-tight overflow-x-hidden relative flex flex-col">
      
      {/* Zoom Overlay */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
        >
          <img src={zoomedImage} alt="Zoomed Asset" className="max-w-full max-h-full object-contain rounded-md animate-fade-in" />
        </div>
      )}

      {/* THE TRANSITIONAL POPUP DRAWER (UI Modal) */}
      {isSolveModalOpen && activeTaskForFix && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-lg bg-[#0B0F17] border border-gray-800 rounded-xl p-6 shadow-[0_0_50px_rgba(0,255,204,0.1)] flex flex-col gap-5 relative">
            <button onClick={() => setIsSolveModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors cursor-pointer">
              <X size={18} />
            </button>
            
            {showSolveVerifier ? (
              <AntiGravityVerifier 
                onVerify={executeSolutionSubmit} 
                onCancel={() => setShowSolveVerifier(false)} 
              />
            ) : (
              <>
                <div className="flex items-center gap-2 text-[#00FFCC] font-bold border-b border-gray-800 pb-3">
                  <Zap size={20} className="animate-pulse" />
                  <span className="tracking-widest uppercase">SUBMIT AUTOMATION PATCH ENGINE</span>
                </div>

                <div className="flex flex-col gap-1 text-xs bg-black p-3 rounded-lg border border-gray-900">
                  <span className="text-gray-500 uppercase tracking-widest">Targeting:</span>
                  <span className="text-white font-mono break-words">{activeTaskForFix.title}</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-400 tracking-widest uppercase">Proof URL Link</label>
                  <input 
                    type="url" 
                    value={proofUrlInput}
                    onChange={(e) => setProofUrlInput(e.target.value)}
                    placeholder="Paste Loom capture link or GitHub Gist URL..."
                    className="w-full bg-black border border-gray-800 focus:border-[#00FFCC] text-white rounded-lg p-3 text-xs focus:outline-none transition-colors"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-gray-400 tracking-widest uppercase">Technical Fix Explanation</label>
                  <textarea 
                    rows={4}
                    value={explanationInput}
                    onChange={(e) => setExplanationInput(e.target.value)}
                    placeholder="Break down the configuration change or code adjustment made to bypass this error log exception..."
                    className="w-full bg-black border border-gray-800 focus:border-[#00FFCC] text-white rounded-lg p-3 text-xs focus:outline-none leading-relaxed resize-none transition-colors"
                  />
                </div>

                <div className="flex justify-between items-center mt-2 gap-4">
                  <button onClick={() => setIsSolveModalOpen(false)} disabled={isUploading} className="text-xs text-gray-500 hover:text-white font-bold tracking-wider uppercase px-2 disabled:opacity-50 cursor-pointer">CANCEL</button>
                  <button 
                    onClick={handleSolutionSubmit} 
                    disabled={isUploading}
                    className="flex-1 bg-[#00FFCC] text-black font-mono tracking-widest font-bold text-xs uppercase py-3.5 rounded-lg hover:bg-white active:scale-95 transition-all shadow-[0_0_15px_rgba(0,255,204,0.15)] glow-on-hover disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? 'UPLOADING...' : 'TRANSMIT RESOLUTION INTO MATRIX'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {renderNavbar()}

      <div className="flex-1 flex flex-col p-4 md:p-8">
        {activeView === 'home' && renderHome()}
        {activeView === 'about' && renderAbout()}
        {activeView === 'matrix' && renderMatrix()}
        {activeView === 'history' && renderHistory()}
        {activeView === 'leaderboard' && renderLeaderboard()}
      </div>

    </div>
  );
}
