import { Router } from "express";
import getBestSupermarkets from "../../services/comparingSupermarkets/getBestSupermarkets.js";
import addLogo from "../../services/comparingSupermarkets/logo.js";
import supermarketsImage from "../../controllers/supermarkets/index.js";

const router = Router();

router.get("/supermarkets/:cartKey", getBestSupermarkets);

router.get(
  "/supermarketsImage",
  supermarketsImage.get.validator,
  supermarketsImage.get.handler
);

router.post(
  "/supermarketsImage",
  supermarketsImage.post.validator,
  supermarketsImage.post.handler
);

router.post(
  "/addLogo", addLogo
);

export default router;
