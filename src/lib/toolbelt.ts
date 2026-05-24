export interface ToolbeltApp {
  id: string;
  name: string;
  description: string;
  engine: string;
  url: string;
  features: string[];
}

export const LINKABLE_APPS: ToolbeltApp[] = [
  {
    id: "unity-ai-gateway",
    name: "Unity AI Gateway (MCP Server)",
    engine: "Unity",
    description: "Official Unity AI assistant integration for project-aware asset/scene generation and code help.",
    url: "https://unity.com/ai",
    features: ["scene-generation", "asset-generation", "code-assistant"]
  },
  {
    id: "unity-coplay",
    name: "Coplay",
    engine: "Unity",
    description: "Collaborative AI agent for tasks inside Unity.",
    url: "https://github.com/unity-coplay",
    features: ["task-automation", "collaboration"]
  },
  {
    id: "ue-neostack",
    name: "NeoStack AI",
    engine: "Unreal Engine",
    description: "Advanced plugin for Blueprints, behavior trees, UIs, and worlds.",
    url: "https://neostack.ai",
    features: ["blueprints", "behavior-trees", "ui-generation"]
  },
  {
    id: "ue-ludus",
    name: "Ludus AI",
    engine: "Unreal Engine",
    description: "C++ assistance, Blueprints copilot, scene generation.",
    url: "https://ludus.ai",
    features: ["cpp-copilot", "scene-generation"]
  },
  {
    id: "godot-ai",
    name: "Godot AI Explorer",
    engine: "Godot",
    description: "MCP-compatible Godot server. Builds scenes, scripts, UI, materials, particles directly in editor.",
    url: "https://github.com/godotengine/godot-ai",
    features: ["scene-building", "node-manipulation", "mcp"]
  },
  {
    id: "godot-assistant-hub",
    name: "Godot AI Assistant Hub",
    engine: "Godot",
    description: "Editor chat, code gen, level drawing (TileMaps), node manipulation.",
    url: "https://godotengine.org/asset-library/asset/ai-assistant",
    features: ["code-gen", "tilemaps", "chat"]
  },
  {
    id: "gms2-ai",
    name: "GMS2-AI Assistant",
    engine: "GameMaker",
    description: "Generates/modifies objects, scripts, rooms via prompts.",
    url: "https://marketplace.yoyogames.com/assets/gms2-ai",
    features: ["room-gen", "gml-scripting"]
  },
  {
    id: "cocos-ai",
    name: "Cocos Creator AI",
    engine: "Cocos Creator",
    description: "Has MCP servers and AI assistants similar to Unity/Godot for 2D/Mobile.",
    url: "https://store.cocos.com/app/en/ai",
    features: ["mcp", "2d-mobile", "scene-gen"]
  },
  {
    id: "cursor-ide",
    name: "Cursor IDE",
    engine: "General / Cross-Engine",
    description: "AI code editor providing general project context for engines like Godot, Defold, and Love2D.",
    url: "https://cursor.com",
    features: ["code-assistant", "project-context"]
  },
  {
    id: "claude-code",
    name: "Claude Code",
    engine: "General / Cross-Engine",
    description: "CLI tool accessing codebase context, excellent for scripting-heavy engines (Godot, Love2D).",
    url: "https://anthropic.com/claude",
    features: ["cli", "codebase-context"]
  }
];
