import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

import express from "express";
import bodyParser from "body-parser";
import { cfg } from "./config";
import { api } from "./api/routes";

const app = express();

// Middleware
app.use(bodyParser.json({ limit: "10mb" }));

// CORS middleware (basic - enhance for production)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  
  next();
});

// Request logging
app.use((req, _res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// API routes
app.use("/", api);

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(cfg.port, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║   🏥 AI Medical Adapter - MVP                ║
║                                               ║
║   Server:  http://localhost:${cfg.port}          ║
║   Model:   ${cfg.openai.model}                    ║
║   Status:  ✅ Ready                           ║
╚═══════════════════════════════════════════════╝
  `);
  
  if (!cfg.openai.apiKey) {
    console.warn("⚠️  WARNING: OPENAI_API_KEY is not set!");
  }
});

