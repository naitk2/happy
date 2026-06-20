import React, { useState } from 'react';
import { Target, Activity, CheckCircle2, ChevronRight, Zap, Database, Code, Shield } from 'lucide-react';

type TaskStatus = 'active' | 'zero-g';

interface Task {
  id: string;
  title: string;
  tool: string;
  mass: number;
  bounty: number;
  status: TaskStatus;
}

const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Zapier loop creating infinite nested arrays in Airtable', tool: 'Zapier', mass: 8, bounty: 150, status: 'active' },
  { id: '2', title: 'OpenAI API rate limit exceeded on parallel chunk processing', tool: 'OpenAI API', mass: 6, bounty: 100, status: 'active' },
  { id: '3', title: 'Make.com webhook payload dropping nested JSON fields', tool: 'Make.com', mass: 7, bounty: 120, status: 'active' },
  { id: '4', title: 'Next.js v0 generated component hydration mismatch', tool: 'v0', mass: 5, bounty: 80, status: 'active' },
];

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  
  // Form state
  const [title, setTitle] = useState('');
  const [tool, setTool] = useState('Make.com');
  const [mass, setMass] = useState(5);
  const [bounty, setBounty] = useState(50);

  // Transition state for animations
  const [animatingTasks, setAnimatingTasks] = useState<Set<string>>(new Set());

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title,
      tool,
      mass,
      bounty,
      status: 'active'
    };

    setTasks(prev => [newTask, ...prev]);
    setTitle('');
    setTool('Make.com');
    setMass(5);
    setBounty(50);
  };

  const handleInjectLift = (taskId: string) => {
    // Start animation
    setAnimatingTasks(prev => {
      const newSet = new Set(prev);
      newSet.add(taskId);
      return newSet;
    });

    // After animation delay, update status
    setTimeout(() => {
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: 'zero-g' } : task
      ));
      setAnimatingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }, 500); // 500ms duration matches the CSS transition
  };

  const activeTasks = tasks.filter(t => t.status === 'active');
  const zeroGTasks = tasks.filter(t => t.status === 'zero-g');

  const burnoutIndex = 84; // Static for prototype or calculate based on active mass
  const totalSolved = 1420 + zeroGTasks.length;

  return (
    <div className="min-h-screen bg-black text-[#8b949e] font-sans selection:bg-[#00ffcc] selection:text-black flex flex-col">
      {/* A. Global Status Header */}
      <header className="w-full border-b border-[#0d1117] bg-[#0d1117]/50 backdrop-blur-md sticky top-0 z-50 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              AntiGravity
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ffcc] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00ffcc]"></span>
              </span>
            </h1>
          </div>
          <p className="text-sm text-[#8b949e]">Lifting the heavy weight of AI tool bloat.</p>
        </div>
        
        <div className="flex items-center gap-6 text-xs font-mono">
          <div className="flex flex-col items-end">
            <span className="text-white">Current Network Burnout Index:</span>
            <span className="text-red-500 font-bold flex items-center gap-2">
              {burnoutIndex}% [Critical] <Activity size={14} />
            </span>
          </div>
          <div className="h-8 w-px bg-slate-800"></div>
          <div className="flex flex-col items-end">
            <span className="text-white">Total System Escape Velocity:</span>
            <span className="text-[#00ffcc] font-bold flex items-center gap-2">
              {totalSolved} Solved Bottlenecks <Target size={14} />
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row p-6 gap-6 max-w-[1600px] w-full mx-auto">
        {/* B. Sidebar Form: "Add Mass to Queue" */}
        <section className="w-full md:w-[35%] flex flex-col gap-4 shrink-0">
          <div className="bg-[#0d1117] rounded-md border border-slate-800 p-6 shadow-2xl hover:shadow-[#00ffcc]/5 transition-shadow duration-300">
            <h2 className="text-white text-lg font-bold mb-6 flex items-center gap-2">
              <Zap size={18} className="text-[#00ffcc]" /> Add Mass to Queue
            </h2>
            
            <form onSubmit={handleAddTask} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wider font-semibold text-[#8b949e]">Technical Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="What automation or API is breaking?"
                  className="bg-black border border-slate-800 rounded-md p-3 text-white text-sm focus:outline-none focus:border-[#00ffcc] focus:ring-1 focus:ring-[#00ffcc] transition-all"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wider font-semibold text-[#8b949e]">Tool Categorization</label>
                <div className="relative">
                  <select 
                    value={tool}
                    onChange={e => setTool(e.target.value)}
                    className="w-full bg-black border border-slate-800 rounded-md p-3 text-white text-sm appearance-none focus:outline-none focus:border-[#00ffcc] focus:ring-1 focus:ring-[#00ffcc] transition-all"
                  >
                    <option value="Make.com">Make.com</option>
                    <option value="OpenAI API">OpenAI API</option>
                    <option value="Zapier">Zapier</option>
                    <option value="Cursor">Cursor</option>
                    <option value="v0">v0</option>
                    <option value="n8n">n8n</option>
                    <option value="Other">Other</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#8b949e]">
                    <ChevronRight size={16} className="rotate-90" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs uppercase tracking-wider font-semibold text-[#8b949e]">Friction Weight</label>
                  <span className="text-[#00ffcc] font-mono text-xs font-bold">{mass} / 10</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={mass}
                  onChange={e => setMass(parseInt(e.target.value))}
                  className="w-full accent-[#00ffcc]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-wider font-semibold text-[#8b949e]">Token Bounty</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00ffcc] font-mono">$</span>
                  <input 
                    type="number" 
                    min="1"
                    value={bounty}
                    onChange={e => setBounty(parseInt(e.target.value))}
                    className="w-full bg-black border border-slate-800 rounded-md p-3 pl-8 text-white text-sm font-mono focus:outline-none focus:border-[#00ffcc] focus:ring-1 focus:ring-[#00ffcc] transition-all"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="mt-4 w-full bg-[#00ffcc] hover:bg-[#00e6b8] text-black font-bold py-3 px-4 rounded-md flex items-center justify-center gap-2 transition-all duration-300 transform active:scale-[0.98] shadow-[0_0_15px_rgba(0,255,204,0.3)] hover:shadow-[0_0_25px_rgba(0,255,204,0.5)]"
              >
                Deploy Roadblock to Orbit
              </button>
            </form>
          </div>
        </section>

        {/* Right Panel */}
        <section className="w-full md:w-[65%] flex flex-col gap-6 min-w-0">
          
          {/* C. Main Queue Dashboard */}
          <div className="flex-1 flex flex-col gap-4">
            <h2 className="text-white text-lg font-bold flex items-center gap-2 px-2">
              <Database size={18} className="text-[#00ffcc]" /> The Mass Stream
            </h2>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {activeTasks.length === 0 ? (
                <div className="text-center py-12 border border-slate-800 border-dashed rounded-md bg-[#0d1117]/30">
                  <p className="text-[#8b949e]">No active roadblocks. Space is clear.</p>
                </div>
              ) : (
                activeTasks.map(task => {
                  const isAnimating = animatingTasks.has(task.id);
                  return (
                    <div 
                      key={task.id}
                      className={`bg-[#0d1117] border border-slate-800 rounded-md p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] hover:border-[#00ffcc]/30 hover:shadow-[0_0_20px_rgba(0,255,204,0.05)] ${
                        isAnimating ? 'opacity-0 -translate-y-12 scale-95 pointer-events-none' : 'opacity-100 translate-y-0 scale-100'
                      }`}
                    >
                      <div className="flex flex-col gap-3 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono tracking-wider px-2 py-1 rounded bg-black border border-slate-800 text-[#8b949e] uppercase flex items-center gap-1">
                            <Code size={10} /> {task.tool}
                          </span>
                          <span className="text-[10px] font-mono tracking-wider px-2 py-1 rounded bg-[#00ffcc]/10 text-[#00ffcc] uppercase border border-[#00ffcc]/20">
                            Bounty: {task.bounty}
                          </span>
                        </div>
                        <h3 className="text-white font-medium text-base leading-tight pr-4 break-words">{task.title}</h3>
                        
                        <div className="w-full max-w-md flex items-center gap-3">
                          <span className="text-xs text-[#8b949e] font-mono w-16">Mass {task.mass}</span>
                          <div className="flex-1 h-1.5 bg-black rounded-full overflow-hidden border border-slate-800/50">
                            <div 
                              className="h-full bg-gradient-to-r from-slate-600 to-[#00ffcc] rounded-full"
                              style={{ width: `${(task.mass / 10) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleInjectLift(task.id)}
                        disabled={isAnimating}
                        className="shrink-0 group relative overflow-hidden border border-[#00ffcc] text-[#00ffcc] hover:bg-[#00ffcc] hover:text-black font-bold text-sm py-2 px-6 rounded-md transition-all duration-300 w-full sm:w-auto mt-2 sm:mt-0"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          Inject Lift <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* D. Success Log: "Zero-G Sanctuary" */}
          <div className="bg-[#0d1117] border border-slate-800 rounded-md p-5 flex flex-col gap-4">
            <h2 className="text-white text-sm font-bold flex items-center gap-2">
              <Shield size={16} className="text-[#00ffcc]" /> Zero-G Sanctuary (Success Log)
            </h2>
            
            <div className="flex flex-wrap gap-2">
              {zeroGTasks.length === 0 ? (
                <span className="text-xs text-[#8b949e] italic">No tasks achieved Zero-G in this session yet.</span>
              ) : (
                zeroGTasks.map(task => (
                  <div key={task.id} className="inline-flex items-center gap-2 bg-black border border-[#00ffcc]/30 px-3 py-1.5 rounded-md max-w-full animate-fade-in">
                    <CheckCircle2 size={14} className="text-[#00ffcc] shrink-0" />
                    <span className="text-[#00ffcc] text-xs font-mono shrink-0">[Zero-G Achieved]</span>
                    <span className="text-white text-xs truncate max-w-[200px] md:max-w-[300px]">{task.title}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}
