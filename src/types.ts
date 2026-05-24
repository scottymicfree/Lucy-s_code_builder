export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  content?: string;
  children?: FileNode[];
}

export type VirtualFileSystem = Record<string, string | { [key: string]: any }>;
