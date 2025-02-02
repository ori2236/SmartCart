import coordinates from "../../controllers/coordinates/index.js";
import { Router } from "express";
import path from "path";

const router = Router();

router.post(
  "/coordinatesByProduct",
  coordinates.coordinatesByProduct.validator,
  coordinates.coordinatesByProduct.handler
);

router.get("/coordinates", coordinates.get.validator, coordinates.get.handler);

export default router;
