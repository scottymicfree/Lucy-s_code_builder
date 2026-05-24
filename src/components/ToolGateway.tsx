import React, { useState, useEffect } from 'react';
import { Layers, Wrench, Terminal, Cpu, Play, CheckCircle2, Gamepad2, FileCode2, Binary, Workflow, TestTube, Network } from 'lucide-react';

interface Tool {
  name: string;
  description: string;
  limbId: string;
  parameters: any;
}

export function ToolGateway() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [executeOutput, setExecuteOutput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toolArgs, setToolArgs] = useState('');
  const [activeTab, setActiveTab] = useState<'tools' | 'adapters' | 'level2'>('tools');

  const fetchTools = async () => {
    try {
      const res = await fetch('/mcp/tools', { headers: { 'x-lucy-secret': 'dev-change-me' } });
      if (res.ok) {
        const data = await res.json();
        setTools(data.tools);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTools();
  }, []);

  const simulateCodeBuilderConnection = async () => {
    try {
      // Register the limb
      await fetch('/neural-link/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-lucy-secret': 'dev-change-me'
        },
        body: JSON.stringify({
          id: 'code-builder-api',
          name: 'Code Builder API',
          url: 'http://localhost:9000',
          capabilities: ['code-generation', 'scene-manipulation']
        })
      });

      // Register tools from Code Builder (using the updated schema you provided)
      await fetch('/mcp/register-tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-lucy-secret': 'dev-change-me'
        },
        body: JSON.stringify({
          limbId: 'code-builder-api',
          tools: [
            {
              name: 'scan_project',
              description: 'Reads full project structure',
              parameters: { type: 'object', properties: { root: { type: 'string' } }, required: ['root'] }
            },
            {
              name: 'edit_file',
              description: 'Writes or modifies a file',
              parameters: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] }
            },
            {
              name: 'fix_ui_signals',
              description: 'Repairs broken UI connections in scenes',
              parameters: { type: 'object', properties: { scene: { type: 'string' } }, required: ['scene'] }
            }
          ]
        })
      });
      
      fetchTools();
    } catch (e) {
      console.error(e);
    }
  };

  const executeTool = async () => {
    if (!selectedTool) return;
    setIsLoading(true);
    setExecuteOutput(null);
    try {
      let argsObj = {};
      if (toolArgs) {
        try {
          argsObj = JSON.parse(toolArgs);
        } catch {
          argsObj = { root: toolArgs, path: toolArgs, scene: toolArgs }; // fallback
        }
      }

      const res = await fetch('/mcp/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-lucy-secret': 'dev-change-me'
        },
        body: JSON.stringify({
          tool: selectedTool.name,
          args: argsObj
        })
      });
      const data = await res.json();
      setExecuteOutput(JSON.stringify(data.result, null, 2));
    } catch (e: any) {
      setExecuteOutput(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full w-full bg-[#0f1117] text-white p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="border-b border-gray-800 pb-6 flex justify-between items-end">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Layers className="w-8 h-8 text-rose-500" />
              <h1 className="text-3xl font-bold">Lucy Tool Runtime (LTR)</h1>
            </div>
            <p className="text-gray-400 max-w-2xl">
              The commandable execution layer. Lucy Core utilizes MCP Tool Protocol to command the Code Builder MCP Server and external Engine Adapters.
            </p>
          </div>
          <button 
            onClick={simulateCodeBuilderConnection}
            className="flex items-center space-x-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-600/40 px-3 py-1.5 rounded transition"
          >
            <Cpu className="w-4 h-4" />
            <span className="text-sm font-semibold">Connect Code Builder</span>
          </button>
        </header>

        {/* LTR Tabs */}
        <div className="flex space-x-2 border-b border-gray-800 pb-1">
          <button 
            onClick={() => setActiveTab('tools')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'tools' ? 'border-rose-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            Connected Tools (MCP)
          </button>
          <button 
            onClick={() => setActiveTab('adapters')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'adapters' ? 'border-amber-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            Engine Adapters
          </button>
          <button 
            onClick={() => setActiveTab('level2')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'level2' ? 'border-purple-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            Level 2 Lucy Systems
          </button>
        </div>

        {activeTab === 'tools' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="space-y-4">
              <h2 className="font-bold flex items-center space-x-2">
                <Wrench className="text-gray-400 w-5 h-5" />
                <span>Registered Tools</span>
              </h2>
              
              {tools.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 text-center text-gray-500">
                  <p>No tools loaded.</p>
                  <p className="text-xs mt-2 text-rose-400/70">Connect the Code Builder to load: scan_project, edit_file, fix_ui_signals.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tools.map(tool => (
                    <button
                      key={tool.name}
                      onClick={() => { setSelectedTool(tool); setExecuteOutput(null); }}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedTool?.name === tool.name ? 'bg-gray-800 border-rose-500/50 text-white' : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800 hover:border-gray-700'}`}
                    >
                      <div className="font-bold">{tool.name}</div>
                      <div className="text-xs opacity-70 truncate mt-1">{tool.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-2 space-y-4">
              <h2 className="font-bold flex items-center space-x-2">
                <Terminal className="text-gray-400 w-5 h-5" />
                <span>Execute Tool (Sandbox)</span>
              </h2>

              {!selectedTool ? (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-500 h-[400px] flex items-center justify-center">
                  Select a tool from the left to run it via /mcp/execute
                </div>
              ) : (
                <div className="bg-gray-900 border border-rose-900/30 rounded-xl overflow-hidden flex flex-col h-[500px]">
                  <div className="bg-gray-950 p-4 border-b border-gray-800 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-rose-300">{selectedTool.name}</h3>
                      <p className="text-sm text-gray-400 mt-1">{selectedTool.description}</p>
                    </div>
                    <span className="text-xs font-mono bg-rose-900/30 text-rose-400 px-2 py-1 flex items-center border border-rose-800 rounded">POST /mcp/execute</span>
                  </div>
                  
                  <div className="p-4 flex-1 overflow-y-auto space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">Arguments (JSON dict)</label>
                      <textarea 
                        value={toolArgs}
                        onChange={e => setToolArgs(e.target.value)}
                        placeholder='{ "scene": "InventoryDashboard" }'
                        className="w-full h-32 bg-[#0f1117] border border-gray-800 rounded-lg p-3 text-sm font-mono text-gray-300 focus:outline-none focus:border-rose-500/50"
                      />
                    </div>

                    <button 
                      onClick={executeTool}
                      disabled={isLoading}
                      className="flex justify-center items-center space-x-2 w-full bg-rose-600 hover:bg-rose-500 text-white py-2.5 rounded-lg transition-colors font-bold disabled:opacity-50"
                    >
                      {isLoading ? <Cpu className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                      <span>Execute via LTR Gateway</span>
                    </button>

                    {executeOutput && (
                      <div className="mt-4 animate-in fade-in slide-in-from-bottom-2">
                        <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span>Result from Code Builder</span>
                        </label>
                        <div className="bg-[#0f1117] border border-gray-800 rounded-lg p-4 font-mono text-sm text-green-400 whitespace-pre-wrap">
                          {executeOutput}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Adapters Tab */}
        {activeTab === 'adapters' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6">
            
            <div className="flex bg-amber-900/20 border border-amber-900/50 p-4 rounded-lg items-center space-x-4">
              <Gamepad2 className="w-8 h-8 text-amber-500 shrink-0" />
              <div>
                <h3 className="font-bold text-amber-500">Engine Adapters</h3>
                <p className="text-sm text-amber-200/80">
                  Implement these adapters inside your game engines. They allow the engine to call Lucy's Tool Gateway (`/mcp/execute`) directly.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Godot Adapter */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
                <div className="bg-[#478cbf]/10 p-3 flex items-center space-x-2 border-b border-gray-800">
                  <FileCode2 className="w-5 h-5 text-[#478cbf]" />
                  <span className="font-bold text-[#478cbf]">Godot (GDScript)</span>
                </div>
                <div className="p-4 bg-gray-950 font-mono text-xs text-gray-300 overflow-x-auto flex-1">
                  <pre>{`extends Node

func call_mcp(tool, args):
    var http = HTTPRequest.new()
    add_child(http)

    var body = {
        "tool": tool,
        "args": args
    }

    http.request(
        "http://localhost:3000/mcp/execute",
        ["Content-Type: application/json", "x-lucy-secret: dev-change-me"],
        HTTPClient.METHOD_POST,
        JSON.stringify(body)
    )`}</pre>
                </div>
              </div>

              {/* Unity Adapter */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
                <div className="bg-white/10 p-3 flex items-center space-x-2 border-b border-gray-800">
                  <Binary className="w-5 h-5 text-gray-100" />
                  <span className="font-bold text-gray-100">Unity (C#)</span>
                </div>
                <div className="p-4 bg-gray-950 font-mono text-xs text-gray-300 overflow-x-auto flex-1">
                  <pre>{`using UnityEngine;
using UnityEngine.Networking;
using System.Text;

public class MCPClient : MonoBehaviour
{
    public void CallTool(string tool, string args)
    {
        StartCoroutine(Send(tool, args));
    }

    System.Collections.IEnumerator Send(string tool, string args)
    {
        var body = "{\\"tool\\":\\""+tool+"\\",\\"args\\":"+args+"}";
        UnityWebRequest req = new UnityWebRequest("http://localhost:3000/mcp/execute", "POST");
        byte[] j = Encoding.UTF8.GetBytes(body);
        req.uploadHandler = new UploadHandlerRaw(j);
        req.downloadHandler = new DownloadHandlerBuffer();
        req.SetRequestHeader("Content-Type", "application/json");
        req.SetRequestHeader("x-lucy-secret", "dev-change-me");

        yield return req.SendWebRequest();
        Debug.Log(req.downloadHandler.text);
    }
}`}</pre>
                </div>
              </div>

              {/* FiveM Adapter */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
                <div className="bg-orange-500/10 p-3 flex items-center space-x-2 border-b border-gray-800">
                  <Terminal className="w-5 h-5 text-orange-500" />
                  <span className="font-bold text-orange-500">FiveM (Lua)</span>
                </div>
                <div className="p-4 bg-gray-950 font-mono text-xs text-gray-300 overflow-x-auto flex-1">
                  <pre>{`function callMCP(tool, args)
    PerformHttpRequest("http://localhost:3000/mcp/execute", 
    function(err, text, headers)
        print(text)
    end, "POST", json.encode({
        tool = tool,
        args = args
    }), 
    { 
      ["Content-Type"] = "application/json",
      ["x-lucy-secret"] = "dev-change-me" 
    })
end

-- Example:
-- callMCP("scan_project", { root = "resources/civil_unrest" })`}</pre>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Level 2 Subsystems */}
        {activeTab === 'level2' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6">
             <div className="flex bg-purple-900/20 border border-purple-900/50 p-4 rounded-lg items-center space-x-4">
              <Workflow className="w-8 h-8 text-purple-400 shrink-0" />
              <div>
                <h3 className="font-bold text-purple-400">Level 2 Lucy Runtime System</h3>
                <p className="text-sm text-purple-200/80">
                  You are no longer building an "AI that helps code". You are building a distributed execution brain that operates game engines and codebases autonomously through tools.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 hover:border-purple-500/50 transition-colors">
                <div className="flex items-center space-x-3 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <h3 className="font-bold text-gray-200">Auto Tool Discovery</h3>
                </div>
                <p className="text-sm text-gray-400 mb-3">Lucy learns new tools dynamically. The system actively queries Godot, Unity, or FiveM for exposed functions, creating its own MCP tools on the fly.</p>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-[60%]"></div>
                </div>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 hover:border-purple-500/50 transition-colors">
                <div className="flex items-center space-x-3 mb-2">
                  <Network className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-gray-200">Deep Memory Graph</h3>
                </div>
                <p className="text-sm text-gray-400 mb-3">Lucy remembers every project state. When generating a new Wave script, she pulls context about the Inventory system she built last week via Neural Link.</p>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 w-[80%]"></div>
                </div>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 hover:border-purple-500/50 transition-colors">
                <div className="flex items-center space-x-3 mb-2">
                  <Activity className="w-5 h-5 text-yellow-500" />
                  <h3 className="font-bold text-gray-200">Shared Event Bus</h3>
                </div>
                <p className="text-sm text-gray-400 mb-3">Godot ↔ Unity ↔ FiveM sync layer. A core WebSocket loop where log streams, compilation errors, and spawn events are monitored continuously by the AI.</p>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 w-[30%]"></div>
                </div>
              </div>

              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 hover:border-purple-500/50 transition-colors">
                <div className="flex items-center space-x-3 mb-2">
                  <TestTube className="w-5 h-5 text-red-400" />
                  <h3 className="font-bold text-gray-200">Autonomous Debugging Loops</h3>
                </div>
                <p className="text-sm text-gray-400 mb-3">She fixes her own failures. Upon catching a Lua crash in FiveM or NullReferenceException in Unity, Lucy calls `edit_file` to fix the bug, re-runs, and verifies.</p>
                <div className="flex space-x-2">
                  <button className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-1.5 rounded text-xs transition">Engage Debug Loop</button>
                  <button className="flex-1 bg-red-900/20 text-red-400 border border-red-900/50 py-1.5 rounded text-xs">Offline</button>
                </div>
              </div>
            </div>
            
          </div>
        )}

      </div>
    </div>
  );
}

// Temporary internal Activity icon definition if not imported above
function Activity(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
}
