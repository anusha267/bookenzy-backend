import { Request, Response, NextFunction } from "express";

// Browsers on these origins may call the API. Override with CORS_ORIGINS (comma separated).
const DEFAULT_ORIGINS = ["https://anusha267.github.io", "http://localhost:3000"];
const allowed = (process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim())
  : DEFAULT_ORIGINS);

export const cors = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (origin && allowed.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
};
