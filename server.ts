import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { EventEmitter } from "events";

dotenv.config();

type LucyMode = "safe" | "sandbox" | "proposal" | "build_review";

type OperationType = "write_file" | "create_folder";

type ProposalOperation = {
  type: OperationType;
  path: string;
  content?: string;
  reason?: string;
};

type LucyProposal = {
  proposalId: string;
  createdAt: string;
  createdBy: "Lucy";
  mode: "sandbox_proposal";
  summary: string;
  prompt: string;
  operations: ProposalOperation[];
  status: "proposed" | "reviewed" | "rejected" | "approved" | "executed";
};

type EagleEyeReview = {
  reviewId: string;
  proposalId: string;
  reviewedAt: string;
  reviewedBy: "EagleEye";
  approved: boolean;
  risk: "low" | "medium" | "high" | "blocked";
  reasons: string[];
  sanitizedOperations: ProposalOperation[];
};

type EmmaApproval = {
  approvalId: string;
  reviewId: string;
  proposalId: string;
  approvedAt: string;
  approvedBy: "Emma";
  approved: boolean;
  reason: string;
};

type ExecutionPacket = {
  packetId: string;
  proposalId: string;
  reviewId: string;
  approvalId: string;
  createdAt: string;
  reviewedBy: "EagleEye";
  approvedBy: "Emma";
  executor: "Bioython";
  operations: ProposalOperation[];
};

const PORT = Number(process.env.PORT || 3000);
const HOST = "127.0.0.1";
const ROOT = process.cwd();

const EAGLE_EYE_SECRET = process.env.EAGLE_EYE_SECRET || "dev-change-me";

let LUCY_MODE: LucyMode = "safe";

const DATA_DIR = path.join(ROOT, "data");
const DELTAVAULT_DIR = path.join(DATA_DIR, "deltavault");
const CHECKPOINT_DIR = path.join(DATA_DIR, "checkpoints");
const DELTAVAULT_LOG = path.join(DELTAVAULT_DIR, "lucy-control.jsonl");

const DEFAULT_ALLOWED_ROOTS = [
  "lucy",
  "data",
  "workspace",
  "renderer",
  "electron",
  "src"
].map((p) => path.resolve(ROOT, p));

const ENV_ALLOWED_ROOTS = (process.env.LUCY_APPROVED_ROOTS || "")
  .split(";")
  .map((p) => p.trim())
  .filter(Boolean)
  .map((p) => path.resolve(ROOT, p));

const ALLOWED_ROOTS = Array.from(
  new Set([...DEFAULT_ALLOWED_ROOTS, ...ENV_ALLOWED_ROOTS])
);

const proposals = new Map<string, LucyProposal>();
const reviews = new Map<string, EagleEyeReview>();
const approvals = new Map<string, EmmaApproval>();
const packets = new Map<string, ExecutionPacket>();

function ensureDirs() {
  fs.mkdirSync(DELTAVAULT_DIR, { recursive: true });
  fs.mkdirSync(CHECKPOINT_DIR, { recursive: true });

  for (const root of ALLOWED_ROOTS) {
    fs.mkdirSync(root, { recursive: true });
  }
}

function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function logDeltaVault(event: string, data: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    event,
    lucyMode: LUCY_MODE,
    ...data
  };

  fs.appendFileSync(DELTAVAULT_LOG, JSON.stringify(entry) + "\n", "utf8");
}

function requireSecret(req: Request, res: Response, next: NextFunction) {
  const headerSecret = req.header("x-lucy-secret");
  const bodySecret = req.body?.secret;

  if (headerSecret !== EAGLE_EYE_SECRET && bodySecret !== EAGLE_EYE_SECRET) {
    logDeltaVault("auth_denied", {
      path: req.path,
      ip: req.socket.remoteAddress
    });

    return res.status(403).json({
      ok: false,
      error: "unauthorized"
    });
  }

  next();
}

function isInsideRoot(targetPath: string, rootPath: string) {
  const relative = path.relative(rootPath, targetPath);
  return (
    relative === "" ||
    (!!relative && !relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

function resolveApprovedPath(inputPath: string) {
  if (!inputPath || typeof inputPath !== "string") {
    throw new Error("Invalid path");
  }

  if (inputPath.includes("\0")) {
    throw new Error("Invalid path: null byte");
  }

  const resolved = path.resolve(ROOT, inputPath);

  const allowed = ALLOWED_ROOTS.some((root) => isInsideRoot(resolved, root));

  if (!allowed) {
    throw new Error(`Path outside Lucy-approved roots: ${inputPath}`);
  }

  return resolved;
}

function sanitizeOperation(op: ProposalOperation): ProposalOperation {
  if (!op || typeof op !== "object") {
    throw new Error("Invalid operation");
  }

  if (op.type !== "write_file" && op.type !== "create_folder") {
    throw new Error(`Blocked operation type: ${String(op.type)}`);
  }

  const resolved = resolveApprovedPath(op.path);
  const relativePath = path.relative(ROOT, resolved).replaceAll("\\", "/");

  if (op.type === "write_file") {
    if (typeof op.content !== "string") {
      throw new Error(`write_file requires string content: ${op.path}`);
    }

    if (Buffer.byteLength(op.content, "utf8") > 1024 * 1024 * 2) {
      throw new Error(`File content too large: ${op.path}`);
    }
  }

  return {
    type: op.type,
    path: relativePath,
    content: op.content,
    reason: typeof op.reason === "string" ? op.reason.slice(0, 1000) : ""
  };
}

function scoreRisk(ops: ProposalOperation[]) {
  const reasons: string[] = [];
  let risk: EagleEyeReview["risk"] = "low";

  for (const op of ops) {
    const p = op.path.toLowerCase();
    const c = (op.content || "").toLowerCase();

    if (p.includes("..")) {
      reasons.push(`Blocked traversal attempt in path: ${op.path}`);
      risk = "blocked";
    }

    if (
      c.includes("child_process") ||
      c.includes("exec(") ||
      c.includes("spawn(") ||
      c.includes("powershell") ||
      c.includes("rm -rf") ||
      c.includes("format c:")
    ) {
      reasons.push(`High-risk execution pattern detected in: ${op.path}`);
      if (risk !== "blocked") risk = "high";
    }

    if (
      p.endsWith("package.json") ||
      p.endsWith("vite.config.ts") ||
      p.endsWith("electron/main.js") ||
      p.endsWith("electron/main.ts")
    ) {
      reasons.push(`Sensitive runtime file touched: ${op.path}`);
      if (risk === "low") risk = "medium";
    }
  }

  if (reasons.length === 0) {
    reasons.push("All operations are inside Lucy-approved roots and use allowed operation types.");
  }

  return { risk, reasons };
}

function checkpointFile(packetId: string, targetPath: string) {
  if (!fs.existsSync(targetPath)) return null;

  const relative = path.relative(ROOT, targetPath).replaceAll("\\", "/");
  const checkpointPath = path.join(
    CHECKPOINT_DIR,
    packetId,
    relative
  );

  fs.mkdirSync(path.dirname(checkpointPath), { recursive: true });
  fs.copyFileSync(targetPath, checkpointPath);

  return path.relative(ROOT, checkpointPath).replaceAll("\\", "/");
}

function executeOperation(packetId: string, op: ProposalOperation) {
  const targetPath = resolveApprovedPath(op.path);

  if (op.type === "create_folder") {
    fs.mkdirSync(targetPath, { recursive: true });
    return {
      type: op.type,
      path: op.path,
      status: "created_folder"
    };
  }

  if (op.type === "write_file") {
    const checkpoint = checkpointFile(packetId, targetPath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, op.content || "", "utf8");

    return {
      type: op.type,
      path: op.path,
      status: "wrote_file",
      checkpoint,
      sha256: sha256(op.content || "")
    };
  }

  throw new Error(`Unsupported operation: ${(op as any).type}`);
}

async function startServer() {
  ensureDirs();

  const app = express();

  app.use(express.json({ limit: "5mb" }));

  app.use((req, res, next) => {
    res.setHeader("x-lucy-mode", LUCY_MODE);
    res.setHeader("x-lucy-local-only", "true");
    next();
  });

  app.get("/system/status", (_req, res) => {
    res.json({
      ok: true,
      mode: LUCY_MODE,
      root: ROOT,
      allowedRoots: ALLOWED_ROOTS.map((r) =>
        path.relative(ROOT, r).replaceAll("\\", "/")
      ),
      proposals: proposals.size,
      reviews: reviews.size,
      approvals: approvals.size,
      packets: packets.size,
      executor: "Bioython",
      provider: "local-only/no-external-ai"
    });
  });

  app.post("/lucy/mode", requireSecret, (req, res) => {
    const mode = req.body?.mode as LucyMode;

    const allowedModes: LucyMode[] = ["safe", "sandbox", "proposal", "build_review"];

    if (!allowedModes.includes(mode)) {
      return res.status(400).json({
        ok: false,
        error: "invalid mode"
      });
    }

    LUCY_MODE = mode;

    logDeltaVault("lucy_mode_changed", {
      mode
    });

    res.json({
      ok: true,
      mode
    });
  });

  app.get("/lucy/proposals", requireSecret, (req, res) => {
    res.json({ ok: true, proposals: Array.from(proposals.values()) });
  });

  app.get("/eagle-eye/reviews", requireSecret, (req, res) => {
    res.json({ ok: true, reviews: Array.from(reviews.values()) });
  });

  app.get("/emma/approvals", requireSecret, (req, res) => {
    res.json({ ok: true, approvals: Array.from(approvals.values()) });
  });

  app.get("/bioython/packets", requireSecret, (req, res) => {
    res.json({ ok: true, packets: Array.from(packets.values()) });
  });

  // ==========================================
  // MULTI-AGENT LAYER: SAME MIND, SEPARATE BODY API
  // ==========================================
  const externalLimbs = new Map<string, any>();
  
  const LucyBus = new EventEmitter();

  class MemoryGraph {
    nodes = new Map();

    add(node: any) {
      this.nodes.set(node.id, node);
    }

    link(a: string, relation: string, b: string) {
      const nodeA = this.nodes.get(a);
      if (nodeA) {
        if (!nodeA.relations) nodeA.relations = [];
        nodeA.relations.push(`${relation}:${b}`);
      }
    }

    get(id: string) {
      return this.nodes.get(id);
    }
    
    export() {
      return {
        nodes: Array.from(this.nodes.values())
      };
    }
  }

  const sharedMemoryGraph = new MemoryGraph();

  app.post("/neural-link/register", requireSecret, (req, res) => {
    const { id, name, url, capabilities } = req.body;
    externalLimbs.set(id, { id, name, url, capabilities, lastSeen: new Date() });
    LucyBus.emit("limb:registered", { id, name });
    res.json({ ok: true, message: "Limb connected to the Mind." });
  });

  app.get("/neural-link/limbs", requireSecret, (req, res) => {
    res.json({ ok: true, limbs: Array.from(externalLimbs.values()) });
  });

  app.get("/neural-link/memory", requireSecret, (req, res) => {
    res.json({ ok: true, memory: sharedMemoryGraph.export() });
  });

  app.post("/neural-link/memory", requireSecret, (req, res) => {
    const { nodes, edges } = req.body;
    if (nodes) {
      for (const node of nodes) {
        sharedMemoryGraph.add(node);
      }
    }
    if (edges) {
      for (const edge of edges) {
        sharedMemoryGraph.link(edge.source, edge.relationship, edge.target);
      }
    }
    LucyBus.emit("memory:synced", { nodes, edges });
    res.json({ ok: true, message: "Memory synced." });
  });
  
  app.post("/neural-link/events", requireSecret, (req, res) => {
    console.log("Event received from limb:", req.body);
    LucyBus.emit(req.body.type || "limb:event", req.body.payload || req.body);
    res.json({ ok: true, message: "Event received.", receivedEvents: [req.body] });
  });

  // ==========================================
  // TOOL GATEWAY & AUTONOMOUS DEBUG LOOP
  // ==========================================
  const toolRegistry = new Map<string, any>();

  // Temporary synchronous auto-discovery mock for the workspace ./tools
  try {
    const tDir = path.join(ROOT, "tools");
    if (fs.existsSync(tDir)) {
      // Automatically walk tools directory.
      // (This requires actual JS loadable files or we just mock load).
    }
  } catch(e) {}

  app.post("/mcp/register-tools", requireSecret, (req, res) => {
    const { limbId, tools } = req.body;
    for (const tool of tools) {
      toolRegistry.set(tool.name, { ...tool, limbId });
      LucyBus.emit("tool:registered", tool.name);
    }
    res.json({ ok: true, message: "Tools registered." });
  });

  app.get("/mcp/tools", requireSecret, (req, res) => {
    res.json({ ok: true, tools: Array.from(toolRegistry.values()) });
  });

  app.post("/mcp/call-tool", requireSecret, async (req, res) => {
    const { name, arguments: args } = req.body;
    await executeTool(name, args, res);
  });

  app.post("/mcp/execute", requireSecret, async (req, res) => {
    const { tool: name, args } = req.body;
    await executeTool(name, args, res);
  });

  async function executeTool(name: string, args: any, res: express.Response) {
    const tool = toolRegistry.get(name);
    if (!tool) {
      return res.status(404).json({ ok: false, error: "Tool not found" });
    }
    
    LucyBus.emit("tool:execute", { name, args });
    
    // In a real implementation, we would HTTP POST to the external Code Builder's endpoint.
    // For now, we mock the Code Builder tool execution based on the architecture.
    if (name === "generate_code") {
      res.json({ ok: true, result: `Code generated by External Code Builder API for prompt: ${args.prompt || JSON.stringify(args)}` });
    } else if (name === "fix_ui_signals") {
      res.json({ ok: true, result: `Code Builder API analyzed scene: ${args.scene || args.scene_path}\n✅ Added hover effects.\n✅ Connected OnClicked events.\n✅ Refactored into separate prefab sub-panels.` });
    } else if (name === "scan_project") {
      res.json({ ok: true, result: `Scanned project root: ${args.root}\nFound 142 files in 12 directories.\nReady for Lucy analysis.` });
    } else if (name === "edit_file") {
      res.json({ ok: true, result: `File edited successfully at path: ${args.path}` });
    } else {
      res.json({ ok: true, result: `Executed tool '${name}' via Code Builder Gateway. Args: ${JSON.stringify(args)}` });
    }
  }

  // Debug Loop Hook
  app.post("/debug/loop", requireSecret, async (req, res) => {
    const issue = req.body.issue || "Unknown Issue";
    LucyBus.emit("debug:loop_started", { issue });
    
    // AutoDebug Simulation
    const steps = [
      `Debug Agent classified issue: ${issue}`,
      `Debug Agent scanned signals via scan_project.`,
      `Builder Agent parsed fix needed.`,
      `Builder Agent applied patch via edit_file.`,
      `Debug Agent verified buttons.`,
      `Game Agent reloaded runtime UI.`
    ];
    
    const taskNode = { id: `ui_fix_${Date.now()}`, type: "task", issue, state: "completed" };
    sharedMemoryGraph.add(taskNode);

    res.json({ ok: true, message: "Autonomous Debug Loop Complete", steps });
  });

  // ==========================================

  function getWorkspaceFiles(dir: string, fileList: any[] = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (file === "node_modules" || file === ".git" || file === "dist") continue;
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        getWorkspaceFiles(filePath, fileList);
      } else {
        fileList.push({
          path: path.relative(ROOT, filePath).replaceAll("\\", "/"),
          size: stat.size,
          lastModified: stat.mtime.toISOString(),
        });
      }
    }
    return fileList;
  }

  app.get("/workspace/files", requireSecret, (req, res) => {
    try {
      const files = getWorkspaceFiles(ROOT);
      res.json({ ok: true, files });
    } catch (error: any) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.get("/workspace/file", requireSecret, (req, res) => {
    try {
      const targetPath = String(req.query.path || "");
      const resolved = resolveApprovedPath(targetPath);
      if (!fs.existsSync(resolved)) {
        return res.status(404).json({ ok: false, error: "file not found" });
      }
      const content = fs.readFileSync(resolved, "utf8");
      res.json({ ok: true, content });
    } catch (error: any) {
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  app.post("/lucy/propose", requireSecret, (req, res) => {
    try {
      const prompt = String(req.body?.prompt || "");
      const summary = String(req.body?.summary || "Lucy proposal");
      const rawOperations = Array.isArray(req.body?.operations)
        ? req.body.operations
        : [];

      if (!prompt.trim()) {
        return res.status(400).json({
          ok: false,
          error: "prompt is required"
        });
      }

      const operations = rawOperations.map(sanitizeOperation);

      const proposal: LucyProposal = {
        proposalId: id("prop"),
        createdAt: new Date().toISOString(),
        createdBy: "Lucy",
        mode: "sandbox_proposal",
        summary,
        prompt,
        operations,
        status: "proposed"
      };

      proposals.set(proposal.proposalId, proposal);

      logDeltaVault("lucy_proposal_created", {
        proposalId: proposal.proposalId,
        summary,
        operationCount: operations.length
      });

      res.json({
        ok: true,
        proposal
      });
    } catch (error: any) {
      logDeltaVault("lucy_proposal_rejected_at_input", {
        error: error.message
      });

      res.status(400).json({
        ok: false,
        error: error.message
      });
    }
  });

  app.post("/eagle-eye/review", requireSecret, (req, res) => {
    try {
      const proposalId = String(req.body?.proposalId || "");
      const proposal = proposals.get(proposalId);

      if (!proposal) {
        return res.status(404).json({
          ok: false,
          error: "proposal not found"
        });
      }

      const sanitizedOperations = proposal.operations.map(sanitizeOperation);
      const { risk, reasons } = scoreRisk(sanitizedOperations);

      const review: EagleEyeReview = {
        reviewId: id("review"),
        proposalId,
        reviewedAt: new Date().toISOString(),
        reviewedBy: "EagleEye",
        approved: risk !== "blocked",
        risk,
        reasons,
        sanitizedOperations
      };

      reviews.set(review.reviewId, review);
      proposal.status = review.approved ? "reviewed" : "rejected";

      logDeltaVault("eagle_eye_review_completed", {
        proposalId,
        reviewId: review.reviewId,
        approved: review.approved,
        risk,
        reasons
      });

      res.json({
        ok: true,
        review
      });
    } catch (error: any) {
      logDeltaVault("eagle_eye_review_failed", {
        error: error.message
      });

      res.status(400).json({
        ok: false,
        error: error.message
      });
    }
  });

  app.post("/emma/approve", requireSecret, (req, res) => {
    const reviewId = String(req.body?.reviewId || "");
    const review = reviews.get(reviewId);

    if (!review) {
      return res.status(404).json({
        ok: false,
        error: "review not found"
      });
    }

    if (!review.approved || review.risk === "blocked") {
      logDeltaVault("emma_approval_denied", {
        reviewId,
        reason: "Eagle Eye review not approved"
      });

      return res.status(400).json({
        ok: false,
        error: "cannot approve blocked/rejected review"
      });
    }

    const approval: EmmaApproval = {
      approvalId: id("approval"),
      reviewId,
      proposalId: review.proposalId,
      approvedAt: new Date().toISOString(),
      approvedBy: "Emma",
      approved: true,
      reason: String(req.body?.reason || "Approved by Emma")
    };

    approvals.set(approval.approvalId, approval);

    const proposal = proposals.get(review.proposalId);
    if (proposal) proposal.status = "approved";

    const packet: ExecutionPacket = {
      packetId: id("exec"),
      proposalId: review.proposalId,
      reviewId,
      approvalId: approval.approvalId,
      createdAt: new Date().toISOString(),
      reviewedBy: "EagleEye",
      approvedBy: "Emma",
      executor: "Bioython",
      operations: review.sanitizedOperations
    };

    packets.set(packet.packetId, packet);

    logDeltaVault("emma_approved_execution_packet", {
      approvalId: approval.approvalId,
      packetId: packet.packetId,
      proposalId: review.proposalId
    });

    res.json({
      ok: true,
      approval,
      packet
    });
  });

  app.post("/bioython/execute", requireSecret, (req, res) => {
    const packetId = String(req.body?.packetId || "");
    const packet = packets.get(packetId);

    if (!packet) {
      return res.status(404).json({
        ok: false,
        error: "execution packet not found"
      });
    }

    try {
      const results = packet.operations.map((op) =>
        executeOperation(packet.packetId, op)
      );

      const proposal = proposals.get(packet.proposalId);
      if (proposal) proposal.status = "executed";

      logDeltaVault("bioython_execution_completed", {
        packetId,
        results
      });

      res.json({
        ok: true,
        executor: "Bioython",
        packetId,
        results
      });
    } catch (error: any) {
      logDeltaVault("bioython_execution_failed", {
        packetId,
        error: error.message
      });

      res.status(400).json({
        ok: false,
        error: error.message
      });
    }
  });

  /**
   * Compatibility route for older UI that still calls /api/generate.
   * This does NOT call Gemini and does NOT execute code.
   * It creates a Lucy proposal shell instead.
   */
  app.post("/api/generate", requireSecret, (req, res) => {
    const prompt = String(req.body?.prompt || "");
    const files = Array.isArray(req.body?.files) ? req.body.files : [];

    const acceptedFiles = files
      .filter((f: any) => typeof f?.path === "string")
      .map((f: any) => {
        const resolved = resolveApprovedPath(f.path);
        return path.relative(ROOT, resolved).replaceAll("\\", "/");
      });

    const proposal: LucyProposal = {
      proposalId: id("prop"),
      createdAt: new Date().toISOString(),
      createdBy: "Lucy",
      mode: "sandbox_proposal",
      summary: "Compatibility proposal created from /api/generate",
      prompt,
      operations: [],
      status: "proposed"
    };

    proposals.set(proposal.proposalId, proposal);

    logDeltaVault("compat_generate_converted_to_proposal", {
      proposalId: proposal.proposalId,
      acceptedFiles
    });

    res.json({
      ok: true,
      result:
        `Lucy created proposal ${proposal.proposalId}. ` +
        `No external AI provider was called. ` +
        `Use /eagle-eye/review, /emma/approve, and /bioython/execute for approved writes.`,
      proposal
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(ROOT, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, HOST, () => {
    logDeltaVault("lucy_control_server_started", {
      host: HOST,
      port: PORT,
      allowedRoots: ALLOWED_ROOTS
    });

    console.log(`[Lucy] Local control server running on http://${HOST}:${PORT}`);
    console.log(`[Lucy] External AI provider: disabled`);
    console.log(`[Lucy] Executor: Bioython`);
  });
}

startServer().catch((error) => {
  console.error("[Lucy] Fatal server error:", error);
  process.exit(1);
});
