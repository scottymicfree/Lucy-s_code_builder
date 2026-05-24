import React, { useState } from 'react';
import { Code, Info, ArrowRight, BookOpen, Search } from 'lucide-react';

export function LearningMode() {
  const [code, setCode] = useState(
`function calculateTotal(price, taxRate) {
  // Multiply price by the tax rate
  const tax = price * taxRate;
  
  // Add tax to original price
  const total = price + tax;
  
  return total;
}`
  );
  const [selectedLine, setSelectedLine] = useState<number | null>(null);

  const getExplanation = (lineText: string, lineNumber: number) => {
    if (!lineText.trim()) return [{ text: "Empty line.", desc: "This line is blank to make the code easier for humans to read." }];
    
    // Very naive parser for demo/beginner mode purposes
    const explanations = [];
    
    if (lineText.includes('function')) {
      explanations.push({ word: 'function', desc: 'The keyword used to declare a reusable block of code.' });
    }
    if (lineText.includes('calculateTotal')) {
      explanations.push({ word: 'calculateTotal', desc: 'The name given to this function.' });
    }
    if (lineText.includes('(') && lineText.includes(')')) {
      explanations.push({ word: '( ... )', desc: 'Parentheses wrap the parameters (inputs) the function accepts.' });
    }
    if (lineText.includes('price')) {
      explanations.push({ word: 'price', desc: 'A variable holding the item\'s cost.' });
    }
    if (lineText.includes('taxRate')) {
      explanations.push({ word: 'taxRate', desc: 'A variable holding the tax percentage.' });
    }
    if (lineText.includes('{')) {
      explanations.push({ word: '{', desc: 'An opening brace starts the block of code that belongs to this function.' });
    }
    if (lineText.includes('//')) {
      explanations.push({ word: '//', desc: 'Double slashes indicate a "comment". The computer ignores this; it is just for humans.' });
    }
    if (lineText.includes('const')) {
      explanations.push({ word: 'const', desc: 'A keyword declaring a variable whose value cannot be reassigned.' });
    }
    if (lineText.includes('tax')) {
      explanations.push({ word: 'tax', desc: 'A new variable named "tax".' });
    }
    if (lineText.includes('=')) {
      explanations.push({ word: '=', desc: 'The assignment operator. It assigns the value on the right to the variable on the left.' });
    }
    if (lineText.includes('*')) {
      explanations.push({ word: '*', desc: 'The multiplication operator.' });
    }
    if (lineText.includes('+')) {
      explanations.push({ word: '+', desc: 'The addition operator.' });
    }
    if (lineText.includes('return')) {
      explanations.push({ word: 'return', desc: 'Passes the final completed value back to the code that called this function.' });
    }
    if (lineText.includes(';')) {
      explanations.push({ word: ';', desc: 'The semicolon indicates the end of a statement (like a period in a sentence).' });
    }
    if (lineText.includes('}')) {
      explanations.push({ word: '}', desc: 'The closing brace marks the end of the code block.' });
    }

    if (explanations.length === 0) {
      explanations.push({ word: lineText, desc: 'General code execution.' });
    }

    return explanations;
  };

  const lines = code.split('\n');

  return (
    <div className="flex h-full w-full bg-[#0f1117] text-white">
      {/* Code Input / Viewer pane */}
      <div className="w-1/2 border-r border-gray-800 flex flex-col">
        <div className="h-12 border-b border-gray-800 flex items-center px-4 shrink-0 font-semibold text-gray-300">
          <BookOpen className="w-4 h-4 mr-2" />
          Interactive Code Learner
        </div>
        
        {/* Source Code Viewer */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-[#151821]">
          {lines.map((line, i) => (
             <div 
               key={i}
               onClick={() => setSelectedLine(i)}
               className={`font-mono text-sm p-1.5 rounded cursor-pointer border transition-colors flex items-center \${
                 selectedLine === i 
                   ? "bg-blue-900/30 border-blue-500/50 text-blue-300 shadow-sm" 
                   : "border-transparent hover:bg-gray-800 text-gray-400"
               }`}
             >
               <span className="opacity-30 select-none inline-block w-8 text-right pr-2 mr-2 border-r border-gray-700">
                 {i + 1}
               </span>
               <span className="whitespace-pre-wrap break-all">{line || " "}</span>
             </div>
          ))}
        </div>
        
        {/* Code Editor */}
        <div className="h-[250px] border-t border-gray-800 flex flex-col shrink-0 shadow-[0_-5px_15px_rgba(0,0,0,0.3)]">
           <div className="text-xs text-gray-500 uppercase px-4 py-2 border-b border-gray-800 shrink-0 font-bold bg-gray-900 flex justify-between items-center">
             <span>✏️ Paste Your Code Here</span>
             <span className="text-[10px] font-normal lowercase tracking-wider opacity-60">
               updates live
             </span>
           </div>
           <textarea 
             className="flex-1 w-full bg-[#0a0b0e] text-green-400 font-mono text-sm p-4 focus:outline-none resize-none leading-relaxed"
             value={code}
             onChange={e => {
               setCode(e.target.value);
               setSelectedLine(null); // Reset selection on edit
             }}
             spellCheck={false}
           />
        </div>
      </div>

      {/* Explanation Pane */}
      <div className="w-1/2 flex flex-col bg-gray-900 relative">
        <div className="h-12 border-b border-gray-800 flex items-center justify-between px-4 shrink-0 font-semibold text-gray-300 bg-[#12141c]">
          <div className="flex items-center">
            <Info className="w-4 h-4 mr-2 text-blue-400" />
            Symbol-by-Symbol Breakdown
          </div>
          {selectedLine !== null && (
            <span className="text-xs text-blue-400 font-mono bg-blue-900/40 px-2 py-1 rounded">
              Line {selectedLine + 1}
            </span>
          )}
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto">
          {selectedLine !== null ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              
              <div className="bg-[#1e212b] p-5 rounded-lg font-mono text-lg text-white border border-gray-700 shadow-inner whitespace-pre-wrap break-all">
                {lines[selectedLine] || <span className="opacity-30 italic">Empty line</span>}
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Analysis</h3>
                
                {getExplanation(lines[selectedLine], selectedLine + 1).map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-3 bg-gray-800 rounded border border-gray-700/50 hover:border-gray-600 transition-colors">
                    <div className="shrink-0 pt-0.5">
                      <span className="inline-block bg-[#2d313f] px-2 py-1 rounded text-blue-300 font-mono text-sm font-bold shadow-sm">
                        {item.word || item.text}
                      </span>
                    </div>
                    <div className="text-gray-300 text-sm leading-relaxed self-center">
                      {item.desc}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 bg-blue-900/10 p-4 rounded border border-blue-500/20 flex gap-3 text-blue-200/80">
                <Search className="w-5 h-5 shrink-0" />
                <p className="text-sm">
                  <strong>Did you know?</strong> Understanding every single character is the fastest way to master coding. The computer treats code strictly, so commas, brackets, and quotes matter!
                </p>
              </div>

            </div>
          ) : (
             <div className="h-full flex flex-col items-center justify-center text-gray-400">
               <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center mb-6">
                 <ArrowRight className="w-8 h-8 opacity-50" />
               </div>
               <p className="text-lg font-semibold mb-2">Select a line to analyze</p>
               <p className="text-sm opacity-60 text-center max-w-sm">
                 Click any line of code on the left to see a detailed, beginner-friendly explanation of what it does.
               </p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
