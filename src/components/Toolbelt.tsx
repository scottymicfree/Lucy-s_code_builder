import React from 'react';
import { LINKABLE_APPS } from '../lib/toolbelt';
import { Wrench, Shield, Zap, Globe, Download, Cpu } from 'lucide-react';

export function ToolbeltView() {
  return (
    <div className="h-full w-full bg-[#0f1117] text-white p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="border-b border-gray-800 pb-6">
          <div className="flex items-center space-x-3 mb-2">
            <Wrench className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold">Lucy Toolbelt & Integrations</h1>
          </div>
          <p className="text-gray-400 max-w-2xl">
            Linkable apps, MCP (Model Context Protocol) servers, and editor plugins that Lucy can connect out to for deep manipulation of external game engines, worlds, and codebases.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {LINKABLE_APPS.map((app) => (
            <div key={app.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-blue-500/50 transition-colors shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-lg text-gray-200">{app.name}</h3>
                <span className="text-xs font-semibold px-2 py-1 bg-gray-800 text-gray-400 rounded-md uppercase tracking-wider shrink-0">
                  {app.engine}
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-4 flex-1">
                {app.description}
              </p>
              
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {app.features.map(f => (
                    <span key={f} className="text-[10px] uppercase tracking-wide bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded border border-blue-800/50">
                      {f}
                    </span>
                  ))}
                </div>
                
                <div className="pt-3 border-t border-gray-800">
                  <a 
                    href={app.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center space-x-2 w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-600/30 py-2 rounded transition-colors text-sm font-medium pt-2 pb-2"
                  >
                    <Globe className="w-4 h-4" />
                    <span>View Integration</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
