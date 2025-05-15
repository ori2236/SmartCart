import RejectedProducts from "../../controllers/rejectedProducts/index.js";
import { Router } from "express";

const router = Router();

router.post(
  "/rejectedProducts",
  RejectedProducts.post.validator,
  RejectedProducts.post.handler
);

router.delete(
  "/rejectedProducts/:cartKey/:productId/:mail",
  RejectedProducts.delete.validator,
  RejectedProducts.delete.handler
);

export default router;
