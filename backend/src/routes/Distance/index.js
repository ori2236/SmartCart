import distance from "../../controllers/distance/index.js";
import { Router } from "express";

const router = Router();

router.post(
    "/distances",
    distance.post.validator,
    distance.post.handler
);


export default router;
