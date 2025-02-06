import favorites from "../../controllers/favorites/index.js";
import { Router } from "express";

const router = Router();

router.post("/favorite", favorites.post.validator, favorites.post.handler);

router.get(
  "/favorite/:type/:content",
  favorites.get.validator,
  favorites.get.handler
);

router.delete(
  "/favorite/:productId/:mail",
  favorites.delete.validator,
  favorites.delete.handler
);

router.put(
  "/favorite/:productId/:mail",
  favorites.put.validator,
  favorites.put.handler
);

router.delete(
  "/favorite/byDetails",
  favorites.deleteByDetails.validator,
  favorites.deleteByDetails.handler
);

router.get("/favorites", favorites.getAll.validator, favorites.getAll.handler);

export default router;
