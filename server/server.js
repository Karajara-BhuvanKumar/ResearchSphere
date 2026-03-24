import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import apiRoutes from "./routes/api.js";
import { initializeHarvestWarmup } from "./services/harvest/harvestService.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      "http://localhost:8080",
      "http://localhost:5173",
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "ResearchSphere API Server",
  });
});

// API Routes
app.use("/api", apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ResearchSphere API Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(
    `🌐 CORS enabled for: ${process.env.FRONTEND_URL || "http://localhost:5173"}`,
  );
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  initializeHarvestWarmup();
});

export default app;
