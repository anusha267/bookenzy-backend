import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import bookRoutes from "./routes/bookRoutes";
import logRoutes from "./routes/logRoutes";
import shelfRoutes from "./routes/shelfRoutes";
import { cors } from "./middleware/cors";
import { authenticateJWT } from "./middleware/authMiddleware";
import sql from "./config/database";

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(cors);
app.use(express.json());

// Lightweight health check (no database call), used by hosting platforms.
app.get("/v1/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Test route to check database connection
app.get("/v1/version", async (req, res) => {
  try {
    const result = await sql(`SELECT version()`);
    const { version } = result[0];
    res.status(200).json({ version });
  } catch (error) {
    console.error("Database query error:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch version from the database" });
  }
});

// Define your routes
app.use("/v1/auth", authRoutes);
app.use("/v1/shelf", shelfRoutes);
app.use("/v1/books", authenticateJWT, bookRoutes);
app.use("/v1/logs", authenticateJWT, logRoutes);

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
