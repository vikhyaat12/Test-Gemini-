import { spawn } from "child_process";
import path from "path";

const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");

function startServer() {
  console.log(`[ServerRunner] Starting Next.js production server on port 3000...`);
  const child = spawn(process.execPath, [nextBin, "start", "-p", "3000"], {
    stdio: "inherit",
    env: { ...process.env, PORT: "3000" }
  });

  child.on("exit", (code, signal) => {
    console.log(`[ServerRunner] Next.js exited with code ${code}, signal ${signal}. Restarting in 2s...`);
    setTimeout(startServer, 2000);
  });

  child.on("error", (err) => {
    console.error(`[ServerRunner] Error spawning Next.js:`, err);
    setTimeout(startServer, 2000);
  });
}

startServer();
