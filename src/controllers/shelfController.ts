import { Request, Response } from "express";
import { addShelfItem, deleteShelfItem, listShelf, ShelfStatus, updateShelfItem } from "../models/shelfModel";

const STATUSES: ShelfStatus[] = ["want", "reading", "finished"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const userId = (req: Request): string => (req as any).user?.user_details?.user_id;
const optInt = (v: unknown) => (Number.isInteger(v) ? (v as number) : undefined);

export const getShelf = async (req: Request, res: Response) => {
  try {
    res.json({ items: await listShelf(userId(req)) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createShelfItem = async (req: Request, res: Response) => {
  const { title, author, status = "want", rating = 0 } = req.body || {};
  if (typeof title !== "string" || !title.trim() || typeof author !== "string" || !author.trim()) {
    return res.status(400).json({ error: "title and author are required" });
  }
  if (!STATUSES.includes(status) || !Number.isInteger(rating) || rating < 0 || rating > 5) {
    return res.status(400).json({ error: "invalid status or rating" });
  }
  try {
    const item = await addShelfItem(userId(req), {
      title: title.trim().slice(0, 300),
      author: author.trim().slice(0, 300),
      status,
      rating,
      coverId: optInt(req.body.coverId),
      pages: optInt(req.body.pages),
      year: optInt(req.body.year),
    });
    res.status(201).json(item);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const patchShelfItem = async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { status, rating } = req.body || {};
  if (!UUID.test(id)) return res.status(404).json({ error: "Not found" });
  if (status !== undefined && !STATUSES.includes(status)) return res.status(400).json({ error: "invalid status" });
  if (rating !== undefined && (!Number.isInteger(rating) || rating < 0 || rating > 5)) {
    return res.status(400).json({ error: "invalid rating" });
  }
  try {
    const item = await updateShelfItem(userId(req), id, { status, rating });
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const removeShelfItem = async (req: Request, res: Response) => {
  const id = String(req.params.id);
  if (!UUID.test(id)) return res.status(404).json({ error: "Not found" });
  try {
    const ok = await deleteShelfItem(userId(req), id);
    res.sendStatus(ok ? 204 : 404);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal server error" });
  }
};
