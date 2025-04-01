import users from "../../controllers/users/index.js";
import rateLimit from "express-rate-limit";
import { Router } from "express";

const router = Router();

const verifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, //10 minutes
  max: 5,
  message: {
    error: "Too many attempts. Please wait 10 minutes before trying again.",
  },
});

router.post("/user", 
    users.post.validator,
    users.post.handler
);

router.post(
  "/verifyCode",
  verifyLimiter,
  users.verifyCode.validator,
  users.verifyCode.handler
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
