import { Router } from "express";
import getProducts from "../../services/comparingSupermarkets/getBestSupermarkets.js";

const router = Router();

router.get("/supermarkets", getProducts);

export default router;
