import { NextRequest } from "next/server";
import chokidar from "chokidar";
import path from "path";

// Server-Sent Events (SSE) route to stream real-time file system edits to frontend
export async function GET(req: NextRequest) {
  const watchPath = process.env.WATCH_DIR || process.cwd();

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Send initial connected event
  const sendEvent = (event: string, data: unknown) => {
    try {
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      writer.write(encoder.encode(payload));
    } catch {
      // Stream closed
    }
  };

  sendEvent("connected", {
    status: "watching",
    directory: watchPath,
    timestamp: Date.now(),
  });

  // Setup chokidar file watcher
  const watcher = chokidar.watch(watchPath, {
    ignored: [
      /(^|[\/\\])\../, // ignore dotfiles (.git, .next)
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
    ],
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100,
    },
  });

  watcher.on("change", (filePath) => {
    const relativePath = path.relative(watchPath, filePath);
    sendEvent("file_change", {
      type: "modified",
      path: relativePath,
      timestamp: Date.now(),
    });
  });

  watcher.on("add", (filePath) => {
    const relativePath = path.relative(watchPath, filePath);
    sendEvent("file_change", {
      type: "created",
      path: relativePath,
      timestamp: Date.now(),
    });
  });

  // Handle client disconnect
  req.signal.addEventListener("abort", () => {
    watcher.close();
    writer.close();
  });

  return new Response(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
