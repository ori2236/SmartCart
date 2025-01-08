import { Router } from "express";
import Users from "./Users/index.js";
import Carts from "./Carts/index.js";
import UserInCart from "./UserInCart/index.js";

const router = Router();

router
  .use("/user", Users)
  .use("/cart", Carts)
  .use("/userInCart", UserInCart);

export default router;