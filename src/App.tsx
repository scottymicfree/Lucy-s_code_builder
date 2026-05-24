import React, { useState, useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { Code, Play, Folder, MessageSquare, Loader2, Key, LayoutDashboard, TerminalSquare, GraduationCap, Wrench, FolderPlus, Network, Layers, Users } from 'lucide-react';
import { FileNode } from './types';
import { FileExplorer } from './components/FileExplorer';
import { Editor } from './components/Editor';
import { Terminal } from './components/Terminal';
import { Dashboard } from './components/Dashboard';
import { LearningMode } from './components/LearningMode';
import { ToolbeltView } from './components/Toolbelt';
import { ProjectSetup } from './components/ProjectSetup';
import { NeuralLinkView } from './components/NeuralLink';
import { ToolGateway } from './components/ToolGateway';
import { AgentCouncil } from './components/AgentCouncil';
import JSZip from 'jszip';
import Markdown from 'react-markdown';

export default function App() {
  const [activeTab, setActiveTab] = useState<'ide' | 'dashboard' | 'learning' | 'toolbelt' | 'project-setup' | 'neural-link' | 'tool-gateway' | 'council'>('dashboard');
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [terminal, setTerminal] = useState<XTerm | null>(null);
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchWorkspace = async () => {
    try {
      const res = await fetch('/workspace/files', { headers: { 'x-lucy-secret': 'dev-change-me' }});
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setFiles(data.files.map((f: any) => ({ name: f.path.split('/').pop(), path: f.path, type: 'file' })));
        }
      }
    } catch (e) {
      console.error("fetchWorkspace error:", e);
    }
  };

  useEffect(() => {
    fetchWorkspace();
    const interval = setInterval(fetchWorkspace, 2000); // Polling for simplicity
    return () => clearInterval(interval);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Replaced by local workspace APIs ideally, but keeping UI prop
  };

  const handleFileSelect = async (file: FileNode) => {
    setSelectedFile(file);
    try {
      const res = await fetch(`/workspace/file?path=${encodeURIComponent(file.path)}`, { headers: { 'x-lucy-secret': 'dev-change-me' }});
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setFileContents(prev => ({ ...prev, [file.path]: data.content }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    // For now, read-only or we can submit save requests
  };

  const runCommand = async (command: string) => {
    terminal?.write(`\\r\\n$ ${command}\\r\\n`);
    terminal?.write(`\\r\\n\\x1b[31m[Bioython] Remote execution disabled in UI for safety. Use backend.\\x1b[0m\\r\\n`);
  };

  const handleGenerate = async () => {
    if (!chatPrompt.trim()) return;

    const userMessage = chatPrompt;
    setChatPrompt('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsGenerating(true);

    try {
      const res = await fetch('/lucy/propose', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-lucy-secret': 'dev-change-me'
        },
        body: JSON.stringify({
          prompt: userMessage,
          summary: "Feature request from chat",
          operations: []
        })
      });

      const data = await res.json();
      if (res.ok) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: `Created Proposal **${data.proposal.proposalId}**. Please review in the DeltaVault.` }]);
      } else {
        setChatHistory(prev => [...prev, { role: 'assistant', content: `**Error:** ${data.error}` }]);
      }
    } catch (err: any) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: `**Error:** ${err.message}` }]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#1e1e1e] text-gray-300 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="h-12 border-b border-gray-800 flex items-center justify-between px-4 shrink-0 bg-gray-900">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-white font-semibold">
            <Code size={20} className="text-blue-500" />
            <span>Lucy Code Builder</span>
          </div>
          <span className="text-xs text-gray-500 italic">Designed by Randy Webb</span>
        </div>
        
        <div className="flex items-center space-x-2 bg-gray-800 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('ide')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded text-sm transition-colors ${activeTab === 'ide' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <TerminalSquare size={14} />
            <span>IDE</span>
          </button>
          <button 
            onClick={() => setActiveTab('learning')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded text-sm transition-colors ${activeTab === 'learning' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <GraduationCap size={14} />
            <span>Learn</span>
          </button>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded text-sm transition-colors ${activeTab === 'dashboard' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <LayoutDashboard size={14} />
            <span>Dashboard</span>
          </button>
          <button 
            onClick={() => setActiveTab('toolbelt')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded text-sm transition-colors ${activeTab === 'toolbelt' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <Wrench size={14} />
            <span>Toolbelt</span>
          </button>
          <button 
            onClick={() => setActiveTab('project-setup')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded text-sm transition-colors ${activeTab === 'project-setup' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <FolderPlus size={14} />
            <span>Project Setup</span>
          </button>
          <button 
            onClick={() => setActiveTab('neural-link')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded text-sm transition-colors ${activeTab === 'neural-link' ? 'bg-indigo-700 text-white' : 'text-indigo-400 hover:text-white border border-indigo-900/30'}`}
          >
            <Network size={14} />
            <span>Neural Link</span>
          </button>
          <button 
            onClick={() => setActiveTab('tool-gateway')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded text-sm transition-colors ${activeTab === 'tool-gateway' ? 'bg-rose-700 text-white' : 'text-rose-400 hover:text-white border border-rose-900/30'}`}
          >
            <Layers size={14} />
            <span>Tool Gateway</span>
          </button>
          <button 
            onClick={() => setActiveTab('council')}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded text-sm transition-colors ${activeTab === 'council' ? 'bg-teal-700 text-white' : 'text-teal-400 hover:text-white border border-teal-900/30'}`}
          >
            <Users size={14} />
            <span>Agent Council</span>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <button 
            onClick={() => runCommand('npm install && npm start')}
            className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded text-sm transition-colors"
          >
            <Play size={14} />
            <span>Install & Start</span>
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 min-h-0">
        {activeTab === 'dashboard' ? (
          <Dashboard />
        ) : activeTab === 'learning' ? (
          <LearningMode />
        ) : activeTab === 'toolbelt' ? (
          <ToolbeltView />
        ) : activeTab === 'project-setup' ? (
          <ProjectSetup />
        ) : activeTab === 'neural-link' ? (
          <NeuralLinkView />
        ) : activeTab === 'tool-gateway' ? (
          <ToolGateway />
        ) : activeTab === 'council' ? (
          <AgentCouncil />
        ) : (
          <div className="w-full h-full flex flex-row">
            {/* File Explorer */}
            <div className="w-[15rem] flex-shrink-0 flex flex-col bg-gray-900 border-r border-gray-800">
              <FileExplorer 
                files={files} 
                onFileSelect={handleFileSelect} 
                onFileUpload={handleFileUpload}
              />
            </div>
            
            {/* Editor & Terminal Area */}
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex-1 min-h-0">
                {selectedFile ? (
                   <div className="h-full flex flex-col">
                      <div className="h-8 bg-gray-900 border-b border-gray-800 flex items-center px-4 text-sm text-gray-400">
                        {selectedFile.path}
                      </div>
                      <div className="flex-1 min-h-0">
                        <Editor 
                          content={fileContents[selectedFile.path] || ''}
                          language={selectedFile.name.endsWith('.tsx') || selectedFile.name.endsWith('.ts') ? 'typescript' : 'javascript'}
                          onChange={handleEditorChange}
                        />
                      </div>
                   </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 border-b border-gray-800">
                    <div className="text-center">
                      <Folder size={48} className="mx-auto mb-4 opacity-50" />
                      <p>Select a file to edit<br/>or upload a ZIP to begin</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="h-[15rem] flex-shrink-0 flex flex-col bg-[#1e1e1e] border-t border-gray-800">
                 <div className="h-8 bg-gray-900 border-b border-gray-800 flex items-center px-4 text-xs tracking-wide uppercase font-semibold text-gray-400 shrink-0">
                   Terminal
                 </div>
                 <div className="flex-1 min-h-0">
                   <Terminal onTerminalReady={setTerminal} />
                 </div>
              </div>
            </div>

            {/* AI Chat Area */}
            <div className="w-[20rem] flex-shrink-0 flex flex-col bg-gray-900 border-l border-gray-800">
              <div className="h-12 border-b border-gray-800 flex items-center px-4 text-sm font-semibold shrink-0 gap-2">
                <MessageSquare size={16} />
                AI Builder Assistant
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatHistory.length === 0 && (
                  <div className="text-gray-500 text-sm text-center mt-10">
                    Upload your project files and ask the AI to modify them, debug issues, or generate full components natively.
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-800 text-gray-300 border border-gray-700'
                    }`}>
                      {msg.role === 'assistant' ? (
                        <div className="markdown-body prose prose-invert max-w-none prose-sm">
                          <Markdown>{msg.content}</Markdown>
                        </div>
                      ) : (
                        <span className="whitespace-pre-wrap">{msg.content}</span>
                      )}
                    </div>
                  </div>
                ))}
                {isGenerating && (
                  <div className="flex items-center space-x-2 text-gray-500 text-sm">
                    <Loader2 size={16} className="animate-spin" />
                    <span>AI is thinking...</span>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-800 bg-gray-900 shrink-0">
                <textarea
                  value={chatPrompt}
                  onChange={(e) => setChatPrompt(e.target.value)}
                  placeholder="Ask AI to modify..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 resize-none h-24 mb-2 text-gray-200"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                />
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <button onClick={() => runCommand('node server.js')} className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs border border-gray-700 transition">
                      Run Node
                    </button>
                    <button onClick={() => runCommand('npm install')} className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs border border-gray-700 transition">
                      npm i
                    </button>
                  </div>
                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || !chatPrompt.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
