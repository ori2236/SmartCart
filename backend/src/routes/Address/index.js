import { Router } from "express";
import completeAddress from "../../controllers/address/index.js";

const router = Router();

router.get(
  "/completeAddress",
  completeAddress.get.validator,
  completeAddress.get.handler
);

export default router;
