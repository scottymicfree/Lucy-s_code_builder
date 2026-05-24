import React, { useState } from 'react';
import { Folder, FileText, ChevronRight, ChevronDown, Upload } from 'lucide-react';
import { FileNode } from '../types';

interface FileExplorerProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface FileNodeProps {
  node: FileNode;
  level: number;
  onFileSelect: (file: FileNode) => void;
}

const FileNodeItem: React.FC<FileNodeProps> = ({ node, level, onFileSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isDir = node.type === 'directory';

  const handleClick = () => {
    if (isDir) {
      setIsExpanded(!isExpanded);
    } else {
      onFileSelect(node);
    }
  };

  return (
    <div>
      <div 
        className="flex items-center gap-1.5 py-1 pr-2 hover:bg-gray-800 rounded cursor-pointer text-sm text-gray-300 group transition-colors"
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        <div className="w-4 h-4 flex items-center justify-center text-gray-500 group-hover:text-gray-300">
          {isDir ? (
            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <span className="w-4" />
          )}
        </div>
        {isDir ? (
          <Folder size={14} className="text-blue-400 shrink-0" />
        ) : (
          <FileText size={14} className="text-gray-400 shrink-0" />
        )}
        <span className="truncate select-none">{node.name}</span>
      </div>
      {isDir && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileNodeItem 
              key={child.path} 
              node={child} 
              level={level + 1} 
              onFileSelect={onFileSelect} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileExplorer: React.FC<FileExplorerProps> = ({ files, onFileSelect, onFileUpload }) => {
  return (
    <div className="w-full h-full bg-gray-900 border-r border-gray-800 flex flex-col select-none">
      <div className="p-3 border-b border-gray-800 flex justify-between items-center bg-gray-950/50">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Files</span>
        <label className="cursor-pointer hover:bg-gray-800 p-1 rounded transition-colors" title="Upload files">
          <Upload size={14} className="text-gray-400" />
          <input type="file" multiple onChange={onFileUpload} className="hidden" />
        </label>
      </div>
      <div className="flex-1 overflow-y-auto py-2 overflow-x-hidden">
        {files.map(node => (
          <FileNodeItem 
            key={node.path} 
            node={node} 
            level={0} 
            onFileSelect={onFileSelect} 
          />
        ))}
      </div>
    </div>
  );
};
