import userInCart from "../../controllers/userInCart/index.js";
import { Router } from "express";

const router = Router();

router.post("/userInCart",
  userInCart.post.validator,
  userInCart.post.handler
);

router.get(
  "/userInCart/:type/:content",
  userInCart.get.validator,
  userInCart.get.handler
);

router.put(
  "/userInCart/:mail/:cartKey",
  userInCart.put.validator,
  userInCart.put.handler
);

router.delete(
  "/userInCart/:mail/:cartKey",
  userInCart.delete.validator,
  userInCart.delete.handler
);

export default router;
