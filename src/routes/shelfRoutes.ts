import { Router } from "express";
import { authenticateJWT } from "../middleware/authMiddleware";
import { createShelfItem, getShelf, patchShelfItem, removeShelfItem } from "../controllers/shelfController";

const router = Router();
router.use(authenticateJWT);
router.get("/", getShelf);
router.post("/", createShelfItem);
router.patch("/:id", patchShelfItem);
router.delete("/:id", removeShelfItem);

export default router;
