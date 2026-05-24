import React, { useState } from 'react';
import { Package, FolderPlus, Rocket, ArrowRight, Loader2, Code2, Server, Gamepad2 } from 'lucide-react';

const TEMPLATES = [
  {
    id: 'react-app',
    name: 'React SPA',
    icon: <Code2 className="w-8 h-8 text-blue-400" />,
    description: 'A modern React Single Page Application using Vite and Tailwind CSS.',
    files: [
      { path: 'workspace/react-app/package.json', content: '{\n  "name": "react-app",\n  "version": "1.0.0",\n  "scripts": {\n    "dev": "vite",\n    "build": "vite build"\n  }\n}' },
      { path: 'workspace/react-app/vite.config.ts', content: 'import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\n\nexport default defineConfig({\n  plugins: [react()]\n});' },
      { path: 'workspace/react-app/index.html', content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>React App</title>\n</head>\n<body>\n  <div id="root"></div>\n  <script type="module" src="/src/main.tsx"></script>\n</body>\n</html>' },
      { path: 'workspace/react-app/src/main.tsx', content: 'import React from "react";\nimport ReactDOM from "react-dom/client";\nimport App from "./App";\nimport "./index.css";\n\nReactDOM.createRoot(document.getElementById("root")!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);' },
      { path: 'workspace/react-app/src/App.tsx', content: 'import React from "react";\n\nexport default function App() {\n  return <div><h1>Hello React</h1></div>;\n}' },
      { path: 'workspace/react-app/src/index.css', content: '/* Tailwind styles would go here */\nbody {\n  margin: 0;\n  font-family: sans-serif;\n}' }
    ]
  },
  {
    id: 'node-api',
    name: 'Node.js Express API',
    icon: <Server className="w-8 h-8 text-green-400" />,
    description: 'A robust backend API setup with Express, TypeScript, and basic routing.',
    files: [
      { path: 'workspace/node-api/package.json', content: '{\n  "name": "node-api",\n  "version": "1.0.0",\n  "scripts": {\n    "dev": "tsx server.ts"\n  }\n}' },
      { path: 'workspace/node-api/tsconfig.json', content: '{\n  "compilerOptions": {\n    "target": "ESNext",\n    "moduleResolution": "node",\n    "esModuleInterop": true,\n    "strict": true\n  }\n}' },
      { path: 'workspace/node-api/server.ts', content: 'import express from "express";\n\nconst app = express();\n\napp.get("/", (req, res) => {\n  res.json({ ok: true, message: "API is running" });\n});\n\napp.listen(3000, () => console.log("Server running on port 3000"));' }
    ]
  },
  {
    id: 'game-plugin',
    name: 'Unity MCP Plugin',
    icon: <Gamepad2 className="w-8 h-8 text-purple-400" />,
    description: 'Basic scaffold for a Unity MCP Server integration to enable AI tooling.',
    files: [
      { path: 'workspace/unity-mcp/manifest.json', content: '{\n  "name": "com.lucy.unity-mcp",\n  "version": "1.0.0",\n  "displayName": "Unity MCP Server"\n}' },
      { path: 'workspace/unity-mcp/Editor/MCPServer.cs', content: 'using UnityEditor;\nusing UnityEngine;\n\npublic class MCPServer : EditorWindow {\n  [MenuItem("Lucy/Start MCP Server")]\n  public static void StartServer() {\n    Debug.Log("MCP Server started");\n  }\n}' }
    ]
  },
  {
    id: 'godot-hexagon',
    name: 'Godot Hexagon Dashboard',
    icon: <Gamepad2 className="w-8 h-8 text-blue-500" />,
    description: 'A modular 3D/UI hexagonal dashboard system fixing zombie buttons by separating panels into distinct scenes.',
    files: [
      { path: 'workspace/godot-hexagon/project.godot', content: '; Engine configuration file.\n[application]\nconfig/name="Hexagon Dashboard"\nconfig/features=PackedStringArray("4.3", "Forward Plus")' },
      { path: 'workspace/godot-hexagon/DashboardManager.gd', content: 'extends Node\n\n# Singleton to manage flipping between panels\nvar current_panel = "MainHUD"\n\nfunc flip_to(panel_name: String):\n\tprint("Flipping to: ", panel_name)\n\tcurrent_panel = panel_name\n\t# Emit signal for animation...\n' },
      { path: 'workspace/godot-hexagon/HexagonContainer.tscn', content: '[gd_scene load_steps=2 format=3]\n\n[node name="HexagonContainer" type="Control"]\nlayout_mode = 3\nanchors_preset = 15\n' },
      { path: 'workspace/godot-hexagon/MainHUDPanel.tscn', content: '[gd_scene load_steps=2 format=3]\n\n[node name="MainHUD" type="Panel"]\n# Logic wired to DashboardManager' },
      { path: 'workspace/godot-hexagon/InventoryDashboard.tscn', content: '[gd_scene load_steps=2 format=3]\n\n[node name="InventoryDashboard" type="Panel"]\n# Logic wired to InventoryManager' },
      { path: 'workspace/godot-hexagon/WaveDashboard.tscn', content: '[gd_scene load_steps=2 format=3]\n\n[node name="WaveDashboard" type="Panel"]\n# Logic wired to WaveManager' }
    ]
  }
];

export function ProjectSetup() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isScaffolding, setIsScaffolding] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleScaffold = async (templateId: string) => {
    setSelectedTemplate(templateId);
    setIsScaffolding(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const template = TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    try {
      // We map the template files directly into a Lucy Proposal
      const operations = template.files.map(f => ({
        type: 'write_file',
        path: f.path,
        content: f.content,
        reason: `Scaffolding ${template.name}`
      }));

      const res = await fetch('/lucy/propose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-lucy-secret': 'dev-change-me'
        },
        body: JSON.stringify({
          prompt: `Scaffold ${template.name} project`,
          summary: `Project Setup: ${template.name}`,
          operations
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        setSuccessMsg(`Proposal ${data.proposal.proposalId} created successfully. Please approve it in the DeltaVault Pipelines (Dashboard).`);
      } else {
        setErrorMsg(data.error || "Failed to create proposal");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "An unexpected error occurred");
    } finally {
      setIsScaffolding(false);
      setSelectedTemplate(null);
    }
  };

  return (
    <div className="h-full w-full bg-[#0f1117] text-white p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="border-b border-gray-800 pb-6">
          <div className="flex items-center space-x-3 mb-2">
            <FolderPlus className="w-8 h-8 text-green-500" />
            <h1 className="text-3xl font-bold">Project Scaffolding</h1>
          </div>
          <p className="text-gray-400 max-w-2xl">
            Quickly bootstrap a new local project in your workspace. Select a template below, and Lucy will generate a proposal containing the required files and configurations.
          </p>
        </header>

        {successMsg && (
          <div className="bg-green-900/30 border border-green-800 text-green-300 p-4 rounded-lg flex items-start space-x-3">
            <Package className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{successMsg}</p>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 p-4 rounded-lg flex items-start space-x-3">
            <p><strong>Error:</strong> {errorMsg}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEMPLATES.map((template) => (
            <div key={template.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-green-500/50 transition-colors shadow-sm flex flex-col group relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 {template.icon}
              </div>
              <div className="flex items-start space-x-4 mb-4">
                <div className="bg-[#1a1c23] p-3 rounded-lg border border-gray-700">
                  {template.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-200 leading-tight mb-1">{template.name}</h3>
                  <p className="text-xs text-gray-500 font-mono">{template.files.length} files structure</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-6 flex-1">
                {template.description}
              </p>
              
              <button 
                onClick={() => handleScaffold(template.id)}
                disabled={isScaffolding}
                className="flex items-center justify-center space-x-2 w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded transition-colors text-sm font-bold group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isScaffolding && selectedTemplate === template.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Scaffold Project</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
