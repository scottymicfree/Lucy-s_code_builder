import React, { useState, useEffect } from 'react';
import { Network, Server, Cpu, Database, Activity, Plus, RefreshCw, Link2 } from 'lucide-react';

interface Limb {
  id: string;
  name: string;
  url: string;
  capabilities: string[];
  lastSeen: string;
}

export function NeuralLinkView() {
  const [limbs, setLimbs] = useState<Limb[]>([]);
  const [memory, setMemory] = useState<any>({ nodes: [], edges: [] });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const headers = { 'x-lucy-secret': 'dev-change-me' };
      const limbsRes = await fetch('/neural-link/limbs', { headers });
      if (limbsRes.ok) {
         const data = await limbsRes.json();
         setLimbs(data.limbs);
      }
      
      const memRes = await fetch('/neural-link/memory', { headers });
      if (memRes.ok) {
         const data = await memRes.json();
         setMemory(data.memory);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const simulateExternalLimbConnection = async () => {
    try {
      await fetch('/neural-link/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-lucy-secret': 'dev-change-me'
        },
        body: JSON.stringify({
          id: `ext-${Math.random().toString(36).substr(2, 5)}`,
          name: 'Unity Engine Assistant Plugin',
          url: 'http://localhost:8080/unity-mcp',
          capabilities: ['scene-generation', 'asset-injection']
        })
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="h-full w-full bg-[#0f1117] text-white p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="border-b border-gray-800 pb-6 flex justify-between items-end">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Network className="w-8 h-8 text-indigo-500" />
              <h1 className="text-3xl font-bold">Neural Link (Shared Mind)</h1>
            </div>
            <p className="text-gray-400 max-w-2xl">
              Manage "Separate Bodies, Same Mind" architecture. External apps (Limbs) connect here via REST/WebSockets to share memory, tools, and the central event bus.
            </p>
          </div>
          <button 
            onClick={fetchData}
            className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded transition"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm">Sync</span>
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Active Limbs */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center space-x-2">
                <Server className="text-indigo-400 w-5 h-5" />
                <span>Connected Limbs (Apps)</span>
              </h2>
              <button 
                onClick={simulateExternalLimbConnection}
                className="flex items-center space-x-1 text-xs bg-indigo-600 hover:bg-indigo-500 px-2 py-1 rounded"
              >
                <Plus className="w-3 h-3" />
                <span>Simulate Remote App</span>
              </button>
            </div>
            
            {limbs.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500 flex flex-col items-center">
                <Link2 className="w-12 h-12 mb-3 opacity-20" />
                <p>No external limbs currently connected.</p>
                <p className="text-sm mt-1 max-w-sm">Use the API endpoint <code>POST /neural-link/register</code> to connect external apps like Godot plugins or Mobile Twin apps.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {limbs.map(limb => (
                  <div key={limb.id} className="bg-gray-900 border border-indigo-900/50 rounded-lg p-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                      <Cpu className="w-16 h-16" />
                    </div>
                    <div className="flex justify-between items-start mb-2 relative z-10">
                      <h3 className="font-bold text-gray-200">{limb.name}</h3>
                      <span className="flex items-center space-x-1 text-[10px] text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded border border-green-800/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                        <span>ONLINE</span>
                      </span>
                    </div>
                    <p className="text-xs font-mono text-gray-500 mb-3">{limb.url}</p>
                    <div className="flex flex-wrap gap-1 mt-auto relative z-10">
                      {limb.capabilities.map(cap => (
                        <span key={cap} className="text-[10px] uppercase bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Shared Memory Stats */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center space-x-2">
              <Database className="text-blue-400 w-5 h-5" />
              <span>Shared Memory Layer</span>
            </h2>
            
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-800">
                <span className="text-gray-400 text-sm">Memory Nodes</span>
                <span className="font-mono text-blue-400">{memory.nodes?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-800">
                <span className="text-gray-400 text-sm">Memory Edges</span>
                <span className="font-mono text-blue-400">{memory.edges?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Event Bus Status</span>
                <span className="font-mono text-green-400 flex items-center space-x-1">
                  <Activity className="w-3 h-3" />
                  <span>Active</span>
                </span>
              </div>
            </div>

            <div className="bg-blue-900/10 border border-blue-900/30 rounded-lg p-4 text-sm text-blue-300">
              <h4 className="font-bold mb-1 text-blue-400">How to integrate</h4>
              <p className="mb-2 text-xs">External apps should implement:</p>
              <ul className="list-disc list-inside space-y-1 text-xs text-blue-300/80">
                <li>REST calls to sync graph memory.</li>
                <li>WebSocket client connecting to the central event bus.</li>
                <li>Local tool execution with results sent back.</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
