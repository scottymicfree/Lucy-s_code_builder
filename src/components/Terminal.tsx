import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface TerminalProps {
  onTerminalReady?: (terminal: XTerm) => void;
}

export const Terminal: React.FC<TerminalProps> = ({ onTerminalReady }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      theme: {
        background: '#1e1e1e',
      },
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 14,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    
    const timeout = setTimeout(() => {
      try {
        fitAddon.fit();
      } catch (e) {
        console.warn('Failed to fit terminal on mount', e);
      }
    }, 50);

    xtermRef.current = term;

    if (onTerminalReady) {
      onTerminalReady(term);
    }

    const handleResize = () => {
      try {
        fitAddon.fit();
      } catch (e) {
        console.warn('Failed to fit terminal on resize', e);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, [onTerminalReady]);

  return <div ref={terminalRef} className="w-full h-full bg-[#1e1e1e] overflow-hidden p-2" />;
};
