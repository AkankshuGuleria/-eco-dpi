const healthUrl = "http://localhost:4000/api/health";
const maxAttempts = 30;
let lastError = "API did not return a successful health response.";
let ready = false;

for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
  try {
    const response = await fetch(healthUrl, { signal: AbortSignal.timeout(2000) });
    if (response.ok) {
      ready = true;
      break;
    }
    lastError = `API health check returned HTTP ${response.status}.`;
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error);
  }

  await new Promise((resolve) => setTimeout(resolve, Math.min(250 * 2 ** Math.min(attempt, 2), 1000)));
}

if (ready) {
  console.log("[dev] API is ready; starting Vite.");
} else {
  console.error(`[dev] API did not become ready at ${healthUrl}: ${lastError}`);
  process.exitCode = 1;
}
