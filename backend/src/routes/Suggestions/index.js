import suggestions from "../../services/suggestions/suggestions.js";
import { Router } from "express";

const router = Router();

router.get("/suggestions/:cartKey/:mail", suggestions);

export default router;
