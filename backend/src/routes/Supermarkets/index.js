import { Router } from "express";
import getBestSupermarkets from "../../services/comparingSupermarkets/getBestSupermarkets.js";

const router = Router();

router.get("/supermarkets/:cartKey", getBestSupermarkets);

export default router;
