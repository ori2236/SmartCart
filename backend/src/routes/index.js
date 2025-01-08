import { Router } from "express";
import Users from "./Users/index.js";
import Carts from "./Carts/index.js";

const router = Router();

router
  //   .use('/ass', Assignments)
  //   .use('/sub', Subjects);
  .use("/user", Users)
  .use("/cart", Carts);

export default router;