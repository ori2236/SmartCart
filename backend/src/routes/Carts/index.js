import carts from "../../controllers/carts/index.js";
import { Router } from "express";

const router = Router();

router.post("/cart", 
    carts.post.validator,
    carts.post.handler
);

router.get("/cart/:id",
  carts.get.validator, 
  carts.get.handler
);

router.put("/cart/:id",
  carts.put.validator,
  carts.put.handler
);

router.delete("/cart/:id",
  carts.delete.validator,
  carts.delete.handler
);

router.delete("/carts",
  carts.deleteAll.validator,
  carts.deleteAll.handler
);



export default router;
