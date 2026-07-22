import dotenv from "dotenv";
import app from "./app.js";
import { connectDatabase, seedDatabaseOnce } from "./database.js";

dotenv.config();

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await connectDatabase();
    await seedDatabaseOnce();
    app.listen(PORT, () => {
      console.log(`[server] Eco-DPI API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("[server] Failed to start:", err);
    process.exit(1);
  }
}

start();
