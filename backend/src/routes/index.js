import { Router } from "express";
import Users from "./Users/index.js";
import Carts from "./Carts/index.js";
import UserInCart from "./UserInCart/index.js";
import Products from "./Products/index.js";
import Favorites from "./Favorites/index.js";
import ProductInCart from "./ProductInCart/index.js";
import Supermarkets from "./Supermarkets/index.js";
import WaitingList from "./WaitingList/index.js"
import CartHistory from "./CartHistory/index.js";
import Suggestions from "./Suggestions/index.js";
import RejectedProducts from "./RejectedProducts/index.js";
import Address from "./Address/index.js";
const router = Router();

router
  .use("/user", Users)
  .use("/cart", Carts)
  .use("/userInCart", UserInCart)
  .use("/product", Products)
  .use("/favorite", Favorites)
  .use("/productInCart", ProductInCart)
  .use("/supermarkets", Supermarkets)
  .use("/waitingList", WaitingList)
  .use("/cartHistory", CartHistory)
  .use("/suggestions", Suggestions)
  .use("/rejectedProducts", RejectedProducts)
  .use("/address", Address);

export default router;