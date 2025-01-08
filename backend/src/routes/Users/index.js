import users from "../../controllers/users/index.js";
import { Router } from "express";

const router = Router();

router.post("/user", 
    users.post.validator,
    users.post.handler
);

router.get("/user/:mail",
  users.get.validator, 
  users.get.handler
);

router.put("/user/:mail",
  users.put.validator,
  users.put.handler
);

router.delete("/user/:mail",
  users.delete.validator,
  users.delete.handler
);

router.delete("/users",
  users.deleteAll.validator,
  users.deleteAll.handler
);

router.get("/users",
  users.getAll.validator,
  users.getAll.handler
);

export default router;
