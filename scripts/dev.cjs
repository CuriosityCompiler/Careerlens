const http = require("node:http");
const path = require("node:path");
const { spawn } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const backendDirectory = path.join(root, "backend");
const frontendDirectory = path.join(root, "frontend");
const viteCli = path.join(frontendDirectory, "node_modules", "vite", "bin", "vite.js");
const python = process.env.PYTHON || "python";

let backendProcess;
let frontendProcess;
let stopping = false;
let backendRestartTimer;
let backendReady = false;

function isApiReady() {
  return new Promise((resolve) => {
    const request = http.get("http://127.0.0.1:8000/docs", (response) => {
      response.resume();
      resolve(response.statusCode === 200);
    });

    request.setTimeout(1000, () => request.destroy());
    request.on("error", () => resolve(false));
  });
}

function startBackend() {
  console.log(`[dev] Starting API with "${python}" on 127.0.0.1:8000`);
  backendProcess = spawn(
    python,
    ["-m", "uvicorn", "server:app", "--host", "127.0.0.1", "--port", "8000"],
    { cwd: backendDirectory, stdio: "inherit", windowsHide: true }
  );

  backendProcess.on("error", (error) => {
    console.error(`[dev] Could not start the API: ${error.message}`);
    if (!backendReady) {
      stop(1);
    }
  });

  backendProcess.on("exit", (code, signal) => {
    if (stopping) return;
    console.error(
      `[dev] API exited (${signal || `code ${code}`}); restarting it in 2 seconds.`
    );
    backendRestartTimer = setTimeout(() => {
      startBackend();
    }, 2000);
  });
}

async function waitForBackend(timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (backendProcess.exitCode !== null || backendProcess.signalCode !== null) {
      throw new Error(
        "The API process stopped during startup. Check the backend output above."
      );
    }
    if (await isApiReady()) return;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  throw new Error(
    "The API did not become ready within 30 seconds. Check the backend output above."
  );
}

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  clearTimeout(backendRestartTimer);
  if (frontendProcess && frontendProcess.exitCode === null) frontendProcess.kill();
  if (backendProcess && backendProcess.exitCode === null) backendProcess.kill();
  process.exitCode = exitCode;
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));

async function main() {
  if (!(await isApiReady())) {
    startBackend();
    await waitForBackend();
    backendReady = true;
  } else {
    console.log("[dev] Using the API already running on 127.0.0.1:8000");
  }

  console.log("[dev] Starting Vite on http://localhost:5173");
  frontendProcess = spawn(
    process.execPath,
    [viteCli, ...process.argv.slice(2)],
    { cwd: frontendDirectory, stdio: "inherit", windowsHide: true }
  );

  frontendProcess.on("error", (error) => {
    console.error(`[dev] Could not start Vite: ${error.message}`);
    stop(1);
  });
  frontendProcess.on("exit", (code, signal) => {
    if (!stopping) stop(signal ? 1 : code || 0);
  });
}

main().catch((error) => {
  console.error(`[dev] ${error.message}`);
  if (error.code === "ENOENT") {
    console.error(
      "[dev] Python was not found. Install Python or set the PYTHON environment variable."
    );
  } else if (error.code === "ECONNREFUSED") {
    console.error(
      "[dev] Port 8000 may already be in use by a service that is not the CareerLens API."
    );
  }
  if (!stopping) stop(1);
});
