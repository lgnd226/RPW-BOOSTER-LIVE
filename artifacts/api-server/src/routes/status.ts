import { Router, type IRouter } from "express";
import { execSync } from "child_process";
import { db } from "@workspace/db";
import os from "os";

const router: IRouter = Router();

const startTime = Date.now();

router.get("/status", async (_req, res) => {
  const uptimeMs = Date.now() - startTime;
  const uptimeSec = Math.floor(uptimeMs / 1000);
  const uptimeMin = Math.floor(uptimeSec / 60);
  const uptimeHrs = Math.floor(uptimeMin / 60);

  // Python version
  let pythonVersion = "unknown";
  try { pythonVersion = execSync("python3 --version 2>&1").toString().trim(); } catch {}

  // curl_cffi version
  let curlCffiVersion = "unknown";
  try {
    curlCffiVersion = execSync(
      "python3 -c \"import curl_cffi; print(curl_cffi.__version__)\" 2>&1"
    ).toString().trim();
  } catch { curlCffiVersion = "not installed"; }

  // DB connection
  let dbStatus = "not configured";
  let dbLatencyMs: number | null = null;
  if (process.env.DATABASE_URL) {
    try {
      const t0 = Date.now();
      await (db as any).execute?.("SELECT 1") || await (db as any).$queryRaw?.`SELECT 1`;
      dbLatencyMs = Date.now() - t0;
      dbStatus = "connected";
    } catch (e: any) {
      dbStatus = `error: ${e?.message?.slice(0, 80) ?? "unknown"}`;
    }
  }

  res.json({
    status: "ok",
    service: "RPW BOOSTER API",
    version: "2.0.0",
    uptime: {
      ms: uptimeMs,
      human: `${uptimeHrs}h ${uptimeMin % 60}m ${uptimeSec % 60}s`,
    },
    server: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: {
        usedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        totalMb: Math.round(os.totalmem() / 1024 / 1024),
      },
    },
    python: {
      version: pythonVersion,
      curlCffi: curlCffiVersion,
    },
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
      configured: !!process.env.DATABASE_URL,
    },
    env: process.env.NODE_ENV ?? "development",
    keepAlive: {
      selfPing: "every 13 min (RENDER_EXTERNAL_URL)",
      githubActions: "every 5 min (keepalive.yml)",
    },
  });
});

export default router;
