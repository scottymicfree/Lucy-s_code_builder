import React, { useState, useEffect } from 'react';
import { Workflow, Network, Cpu, Settings, Shield, Target, Play, ShieldAlert, MonitorPlay, Zap, Database, CheckCircle2 } from 'lucide-react';

export function AgentCouncil() {
  const [activeTab, setActiveTab] = useState<'agents' | 'memory' | 'debug'>('agents');
  const [memoryGraph, setMemoryGraph] = useState<any>({ nodes: [] });
  const [debugIssue, setDebugIssue] = useState('');
  const [debugSteps, setDebugSteps] = useState<string[]>([]);
  const [isDebugging, setIsDebugging] = useState(false);

  const fetchMemory = async () => {
    try {
      const res = await fetch('/neural-link/memory', { headers: { 'x-lucy-secret': 'dev-change-me' } });
      if (res.ok) {
        const data = await res.json();
        setMemoryGraph(data.memory);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMemory();
  }, [activeTab]);

  const runDebugLoop = async () => {
    if (!debugIssue) return;
    setIsDebugging(true);
    setDebugSteps([]);
    try {
      const res = await fetch('/debug/loop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-lucy-secret': 'dev-change-me'
        },
        body: JSON.stringify({ issue: debugIssue })
      });
      const data = await res.json();
      if (data.ok) {
        setDebugSteps(data.steps);
        fetchMemory();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDebugging(false);
    }
  };

  const agents = [
    {
      id: "lucy_prime",
      name: "Lucy Prime",
      role: "Coordinator",
      icon: <Workflow className="w-8 h-8 text-indigo-400" />,
      color: "border-indigo-500/50",
      bgColor: "bg-indigo-900/20",
      description: "Arbitration, scheduling, memory summaries, and policy enforcement.",
      bias: { Focus: 0.9, Synthesis: 0.85, Stability: 0.95 },
      tools: ["summarize_memory", "assign_agent", "enforce_policy"]
    },
    {
      id: "builder_agent",
      name: "Builder Agent",
      role: "Construction & Implementation",
      icon: <Cpu className="w-8 h-8 text-rose-400" />,
      color: "border-rose-500/50",
      bgColor: "bg-rose-900/20",
      description: "Generates code, scaffolds systems, wires UI, and builds dashboards.",
      bias: { Focus: 0.92, Exploration: 0.35, Stability: 0.84 },
      tools: ["edit_file", "create_scene", "patch_config"]
    },
    {
      id: "debug_agent",
      name: "Debug Agent",
      role: "Repair & Verification",
      icon: <ShieldAlert className="w-8 h-8 text-amber-500" />,
      color: "border-amber-500/50",
      bgColor: "bg-amber-900/20",
      description: "Detects failures, traces stack errors, and verifies tool outputs. Highly skeptical and paranoid.",
      bias: { Skepticism: 0.95, Stability: 0.98, Novelty: 0.12 },
      tools: ["scan_logs", "inspect_state", "trace_events"]
    },
    {
      id: "game_agent",
      name: "Game Agent",
      role: "Runtime Orchestrator",
      icon: <MonitorPlay className="w-8 h-8 text-emerald-400" />,
      color: "border-emerald-500/50",
      bgColor: "bg-emerald-900/20",
      description: "NPC orchestration, game state syncing, wave systems, and engine communication.",
      bias: { Reactivity: 0.85, Focus: 0.74, Adaptability: 0.88 },
      tools: ["trigger_event", "sync_state", "modify_ui_runtime"]
    }
  ];

  return (
    <div className="h-full w-full bg-[#0a0a0f] text-white p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="border-b border-gray-800 pb-6">
          <div className="flex items-center space-x-3 mb-2">
            <Target className="w-8 h-8 text-purple-500" />
            <h1 className="text-3xl font-bold">Lucy Agent Council</h1>
          </div>
          <p className="text-gray-400 max-w-3xl">
            A distributed cognitive operating layer. Instead of one monolithic AI, Lucy operates as a council of specialized agents connected by a Shared Event Bus and Memory Graph.
          </p>
        </header>

        {/* Navigation */}
        <div className="flex space-x-2 border-b border-gray-800 pb-1">
          <button 
            onClick={() => setActiveTab('agents')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'agents' ? 'border-purple-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            Agent Council Roster
          </button>
          <button 
            onClick={() => setActiveTab('memory')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'memory' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            Memory Graph Status
          </button>
          <button 
            onClick={() => setActiveTab('debug')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'debug' ? 'border-amber-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            Autonomous Debug Loop
          </button>
        </div>

        {/* Agents Tab */}
        {activeTab === 'agents' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2">
            {agents.map(agent => (
              <div key={agent.id} className={`bg-gray-900 border ${agent.color} rounded-xl overflow-hidden flex flex-col`}>
                <div className={`${agent.bgColor} p-4 border-b border-gray-800 flex items-center space-x-4`}>
                  {agent.icon}
                  <div>
                    <h2 className="text-xl font-bold">{agent.name}</h2>
                    <p className="text-sm text-gray-300 opacity-80">{agent.role}</p>
                  </div>
                </div>
                <div className="p-5 flex-1 space-y-4">
                  <p className="text-sm text-gray-400">{agent.description}</p>
                  
                  <div>
                    <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2">Personality Bias</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(agent.bias).map(([key, val]) => (
                        <div key={key} className="bg-[#0a0a0f] p-2 rounded border border-gray-800 flex flex-col items-center justify-center">
                          <span className="text-[10px] text-gray-500 uppercase">{key}</span>
                          <span className="text-sm font-mono text-gray-300">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2">Allowed Tools</h3>
                    <div className="flex flex-wrap gap-2">
                      {agent.tools.map(tool => (
                        <span key={tool} className="text-xs font-mono bg-gray-800 text-gray-300 py-1 px-2 rounded">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Memory Tab */}
        {activeTab === 'memory' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6">
            <div className="bg-indigo-900/20 border border-indigo-500/50 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Database className="w-6 h-6 text-indigo-400" />
                <h2 className="text-lg font-bold">Relational Memory Graph</h2>
              </div>
              <p className="text-sm text-indigo-200/80 mb-6 max-w-3xl">
                Lucy remembers WHY things broke, not just what happened. This graph stores persistent reasoning history so agents can trace system failures across execution contexts.
              </p>
              
              <div className="bg-[#0a0a0f] border border-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-800">
                  <span className="text-sm font-semibold text-gray-400">Exported Nodes</span>
                  <button onClick={fetchMemory} className="text-xs bg-indigo-600 hover:bg-indigo-500 px-2 py-1 rounded transition">Refresh Graph</button>
                </div>
                
                {(!memoryGraph.nodes || memoryGraph.nodes.length === 0) ? (
                  <div className="text-center py-8 text-gray-500">
                    <Network className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Memory graph is empty.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {memoryGraph.nodes.map((node: any, idx: number) => (
                      <div key={idx} className="bg-gray-900 p-3 rounded border border-gray-800 font-mono text-xs">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-indigo-400 font-bold">{node.id}</span>
                          <span className="bg-gray-800 px-2 py-0.5 rounded text-gray-400">Type: {node.type}</span>
                        </div>
                        <pre className="text-gray-400 whitespace-pre-wrap">
                          {JSON.stringify(node, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Debug Loop Tab */}
        {activeTab === 'debug' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-amber-900/20 border border-amber-500/50 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <ShieldAlert className="w-6 h-6 text-amber-500" />
                  <h2 className="text-lg font-bold">Autonomous Debug Loop</h2>
                </div>
                <p className="text-sm text-amber-200/80 mb-6">
                  Trigger an autonomous cascade. The Debug Agent detects the failure, the Builder Agent patches it, and the Game Agent reloads the UI.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">Report Issue</label>
                    <textarea 
                      value={debugIssue}
                      onChange={e => setDebugIssue(e.target.value)}
                      placeholder='e.g., "The WaveDashboard Start button does nothing when clicked."'
                      className="w-full h-24 bg-[#0a0a0f] border border-gray-800 rounded-lg p-3 text-sm text-gray-300 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <button 
                    onClick={runDebugLoop}
                    disabled={isDebugging || !debugIssue}
                    className="flex justify-center items-center space-x-2 w-full bg-amber-600 hover:bg-amber-500 disabled:bg-gray-800 disabled:text-gray-500 text-white py-3 rounded-lg transition-colors font-bold"
                  >
                    {isDebugging ? <Zap className="w-5 h-5 animate-pulse" /> : <Play className="w-5 h-5" />}
                    <span>{isDebugging ? 'Running Diagnostic Loop...' : 'Engage Autonomous Debug Loop'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-lg font-bold flex items-center space-x-2 border-b border-gray-800 pb-2">
                <Network className="w-5 h-5 text-gray-400" />
                <span>Execution Trace</span>
              </h2>

              {debugSteps.length === 0 ? (
                <div className="h-64 flex items-center justify-center border border-dashed border-gray-800 rounded-xl text-gray-500 text-sm">
                  Run a debug loop to see the agent coordination trace.
                </div>
              ) : (
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-800 before:to-transparent">
                  {debugSteps.map((step, idx) => (
                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-gray-900 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow shadow-amber-500/20">
                        <CheckCircle2 className="w-5 h-5 text-amber-500" />
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-800 bg-gray-900/50 shadow shadow-black/50">
                        <div className="text-sm text-gray-300 font-mono">
                          {step}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
          </div>
        )}

      </div>
    </div>
  );
}
