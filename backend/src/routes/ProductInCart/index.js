import ProductInCart from "../../controllers/productInCart/index.js";
import { Router } from "express";

const router = Router();

router.post(
  "/productInCart",
  ProductInCart.post.validator,
  ProductInCart.post.handler
);

router.post(
  "/existngProduct",
  ProductInCart.postWithProductId.validator,
  ProductInCart.postWithProductId.handler
);

router.get(
  "/productInCart/:type/:content",
  ProductInCart.get.validator,
  ProductInCart.get.handler
);

router.put(
  "/productInCart/:cartKey/:productId",
  ProductInCart.put.validator,
  ProductInCart.put.handler
);

router.delete(
  "/productInCart/:cartKey/:productId",
  ProductInCart.delete.validator,
  ProductInCart.delete.handler
);

router.delete(
  "/productInCarts",
  ProductInCart.deleteAll.validator,
  ProductInCart.deleteAll.handler
);

router.get(
  "/productInCarts",
  ProductInCart.getAll.validator,
  ProductInCart.getAll.handler
);

export default router;
