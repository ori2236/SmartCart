import products from "../../controllers/products/index.js";
import { Router } from "express";
import getProducts from "../../services/chp/getProducts.js";

const router = Router();

router.post("/product", products.post.validator, products.post.handler);

router.get("/product/:id", products.get.validator, products.get.handler);

router.put("/product/:id", products.put.validator, products.put.handler);

router.delete(
  "/product/:id",
  products.delete.validator,
  products.delete.handler
);

router.delete(
  "/products",
  products.deleteAll.validator,
  products.deleteAll.handler
);

router.get("/products", products.getAll.validator, products.getAll.handler);

router.get("/productsFromSearch", getProducts)

router.get(
  "/productByName",
  products.getByName.validator,
  products.getByName.handler
);
export default router;
