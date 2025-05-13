import favorites from "../../controllers/favorites/index.js";
import { Router } from "express";

const router = Router();

router.post("/favorite", favorites.post.validator, favorites.post.handler);

router.get(
  "/favorite/:mail/:cartKey",
  favorites.get.validator,
  favorites.get.handler
);

router.put(
  "/favorite/:productId/:mail",
  favorites.put.validator,
  favorites.put.handler
);

router.delete(
  "/favorite",
  favorites.delete.validator,
  favorites.delete.handler
);

export default router;
