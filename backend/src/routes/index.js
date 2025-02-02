import { Router } from "express";
import Users from "./Users/index.js";
import Carts from "./Carts/index.js";
import UserInCart from "./UserInCart/index.js";
import Products from "./Products/index.js";
import Favorites from "./Favorites/index.js";
import ProductInCart from "./ProductInCart/index.js";
import Coordinates from "./Coordinates/index.js";

const router = Router();

router
  .use("/user", Users)
  .use("/cart", Carts)
  .use("/userInCart", UserInCart)
  .use("/product", Products)
  .use("/favorite", Favorites)
  .use("/productInCart", ProductInCart)
  .use("/coordinates", Coordinates);

export default router;