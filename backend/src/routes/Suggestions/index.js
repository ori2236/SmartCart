import suggestions from "../../services/suggestions/suggestions.js";
import { Router } from "express";

const router = Router();

router.get("/suggestions/:cartKey", suggestions);

export default router;
