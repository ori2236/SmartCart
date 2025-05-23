import cartHistory from "../../controllers/cartHistory/index.js";
import { Router } from "express";

const router = Router();

router.post("/cartHistory", cartHistory.post.validator, cartHistory.post.handler);

router.delete(
  "/cartHistory",
  cartHistory.delete.validator,
  cartHistory.delete.handler
);

export default router;
