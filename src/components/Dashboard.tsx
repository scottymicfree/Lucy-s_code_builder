import React, { useState, useEffect } from "react";
import { useLucyMode } from "../lib/useLucyMode";

export function Dashboard() {
  const [logs, setLogs] = useState<string[]>([]);
  const [systemState, setSystemState] = useState<any>({});
  const [proposals, setProposals] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [packets, setPackets] = useState<any[]>([]);
  
  const lucyMode = useLucyMode();

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-49), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const fetchSystemData = async () => {
    try {
      const headers = { 'x-lucy-secret': 'dev-change-me' };
      const statusRes = await fetch("/system/status", { headers });
      if (statusRes.ok) setSystemState(await statusRes.json());
      
      const propsRes = await fetch("/lucy/proposals", { headers });
      if (propsRes.ok) setProposals((await propsRes.json()).proposals || []);

      const revsRes = await fetch("/eagle-eye/reviews", { headers });
      if (revsRes.ok) setReviews((await revsRes.json()).reviews || []);

      const appRes = await fetch("/emma/approvals", { headers });
      if (appRes.ok) setApprovals((await appRes.json()).approvals || []);

      const packRes = await fetch("/bioython/packets", { headers });
      if (packRes.ok) setPackets((await packRes.json()).packets || []);
    } catch (e) {
      console.error("fetchSystemData error:", e);
    }
  };

  useEffect(() => {
    fetchSystemData();
    const int = setInterval(fetchSystemData, 3000);
    return () => clearInterval(int);
  }, []);

  const triggerReview = async (proposalId: string) => {
    try {
      addLog(`Requesting Eagle Eye review for ${proposalId}`);
      await fetch('/eagle-eye/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-lucy-secret': 'dev-change-me' },
        body: JSON.stringify({ proposalId })
      });
      fetchSystemData();
    } catch (e) {}
  };

  const triggerApproval = async (reviewId: string) => {
    try {
      addLog(`Requesting Emma approval for ${reviewId}`);
      await fetch('/emma/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-lucy-secret': 'dev-change-me' },
        body: JSON.stringify({ reviewId, reason: 'Approved via UI' })
      });
      fetchSystemData();
    } catch (e) {}
  };

  const triggerExecute = async (packetId: string) => {
    try {
      addLog(`Bioython executing packet ${packetId}`);
      await fetch('/bioython/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-lucy-secret': 'dev-change-me' },
        body: JSON.stringify({ packetId })
      });
      fetchSystemData();
    } catch (e) {}
  };

  return (
    <div className="h-full w-full bg-[#0f1117] text-white flex overflow-hidden">

      {/* LEFT: System Summary */}
      <div className="w-1/4 border-r border-gray-800 p-4 space-y-4 overflow-y-auto">
        <h1 className="text-xl font-bold mb-4">⚙️ Lucy Code Builder</h1>

        <div className="bg-gray-900 border border-gray-800 p-4 rounded flex flex-col mb-4">
          <span className="text-gray-400 text-xs uppercase font-semibold mb-1">Global Mode</span>
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono font-bold text-green-400">{lucyMode.toUpperCase()}</span>
          </div>
          <div className="flex space-x-1">
            <button 
              onClick={() => fetch('/lucy/mode', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-lucy-secret': 'dev-change-me' }, body: JSON.stringify({ mode: 'safe' }) })}
              className="flex-1 px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-[10px] uppercase font-bold text-green-400 transition"
            >
              Safe
            </button>
            <button 
              onClick={() => fetch('/lucy/mode', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-lucy-secret': 'dev-change-me' }, body: JSON.stringify({ mode: 'sandbox' }) })}
              className="flex-1 px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-[10px] uppercase font-bold text-orange-400 transition"
            >
              Sandbox
            </button>
          </div>
        </div>

        <div className="p-3 bg-gray-900 rounded space-y-2 text-sm">
          <p className="text-gray-400 uppercase text-xs font-bold border-b border-gray-800 pb-1 flex justify-between">
            <span>Security</span>
            <span className="text-green-500">Active</span>
          </p>
          <div className="flex justify-between"><span>Execution:</span> <span className="text-blue-400">Bioython Local</span></div>
          <div className="flex justify-between"><span>Environment:</span> <span className="text-orange-400">Electron Desktop</span></div>
        </div>
        
        <div className="p-3 bg-gray-900 rounded space-y-2 text-sm">
          <p className="text-gray-400 uppercase text-xs font-bold border-b border-gray-800 pb-1">Allowed Roots</p>
          {systemState.allowedRoots?.map((r: string) => (
             <div key={r} className="text-gray-500 truncate" title={r}>/{r}</div>
          ))}
        </div>
      </div>

      {/* CENTER: Pipelines */}
      <div className="w-1/2 border-r border-gray-800 p-4 flex flex-col space-y-4 overflow-y-auto">
        <h2 className="font-bold text-lg">DeltaVault Pipelines</h2>

        {/* Proposals */}
        <div className="space-y-2">
          <h3 className="text-sm uppercase text-gray-500 font-bold border-b border-gray-800 pb-1 shrink-0 bg-[#0f1117] sticky top-0">1. Lucy Proposals ({proposals.length})</h3>
          {proposals.map(p => (
            <div key={p.proposalId} className="bg-gray-900 p-3 rounded text-sm border border-gray-800">
              <div className="flex justify-between font-mono mb-2">
                <span className="text-blue-400">{p.proposalId}</span>
                <span className={p.status === 'proposed' ? 'text-yellow-400' : 'text-gray-500'}>{p.status}</span>
              </div>
              <p className="text-gray-300 italic mb-3">{p.summary}</p>
              {p.status === 'proposed' && (
                <button onClick={() => triggerReview(p.proposalId)} className="w-full bg-blue-600 hover:bg-blue-700 py-1 rounded text-xs">Run Eagle Eye Review</button>
              )}
            </div>
          ))}
        </div>

        {/* Reviews */}
        <div className="space-y-2">
           <h3 className="text-sm uppercase text-gray-500 font-bold border-b border-gray-800 pb-1 mt-4 shrink-0 bg-[#0f1117] sticky top-0">2. Eagle Eye Reviews ({reviews.length})</h3>
           {reviews.map(r => (
            <div key={r.reviewId} className={`p-3 rounded text-sm border ${r.approved ? 'bg-[#121f18] border-green-900/50' : 'bg-[#1f1212] border-red-900/50'}`}>
              <div className="flex justify-between font-mono mb-2">
                <span className={r.approved ? 'text-green-400' : 'text-red-400'}>{r.reviewId}</span>
                <span className="text-gray-500">{r.proposalId}</span>
              </div>
              <ul className="text-gray-400 mb-3 text-xs space-y-1">
                {r.reasons.map((rs: string, i: number) => <li key={i}>• {rs}</li>)}
              </ul>
              {r.approved && !approvals.find(a => a.reviewId === r.reviewId) && (
                <button onClick={() => triggerApproval(r.reviewId)} className="w-full bg-green-700 hover:bg-green-600 py-1 rounded text-xs mt-2">Emma Approval Override</button>
              )}
            </div>
          ))}
        </div>

        {/* Execution */}
        <div className="space-y-2">
           <h3 className="text-sm uppercase text-gray-500 font-bold border-b border-gray-800 pb-1 mt-4 shrink-0 bg-[#0f1117] sticky top-0">3. Bioython Execution ({packets.length})</h3>
           {packets.map(pk => (
            <div key={pk.packetId} className="bg-[#1a1c23] p-3 rounded text-sm border border-gray-700">
              <div className="flex justify-between font-mono mb-2">
                <span className="text-orange-400">{pk.packetId}</span>
              </div>
              <div className="text-xs text-gray-400 mb-3">
                 <p>Operations: {pk.operations.length}</p>
                 <p>Linked Review: {pk.reviewId}</p>
              </div>
              {proposals.find(p => p.proposalId === pk.proposalId)?.status !== 'executed' && (
                <button onClick={() => triggerExecute(pk.packetId)} className="w-full bg-orange-600 hover:bg-orange-500 text-white py-1 rounded text-xs font-bold">EXECUTE PACKET (Local Disk)</button>
              )}
              {proposals.find(p => p.proposalId === pk.proposalId)?.status === 'executed' && (
                <p className="text-center text-xs text-green-500 font-bold">Packet Executed</p>
              )}
            </div>
           ))}
        </div>

      </div>

      {/* RIGHT: Live Logs */}
      <div className="w-1/4 p-4 flex flex-col bg-black">
        <h2 className="font-bold mb-2 shrink-0 text-sm text-gray-500 uppercase tracking-wider">DeltaVault System Logs</h2>
        <div className="flex-1 overflow-auto text-xs space-y-1 font-mono">
          {logs.map((l, i) => (
            <div key={i} className="text-gray-400 border-b border-gray-900 pb-1 break-words">{l}</div>
          ))}
        </div>
      </div>

    </div>
  );
}
