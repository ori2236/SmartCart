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

router.post("/register", users.register.validator, users.register.handler);

router.post(
  "/verifyCode",
  verifyLimiter,
  users.verifyCode.validator,
  users.verifyCode.handler
);

router.post("/login", users.login.validator, users.login.handler);

router.post("/sendCode", users.sendCode.validator, users.sendCode.handler);

router.get("/user/:mail", users.get.validator, users.get.handler);

router.put(
  "/replacePassword",
  users.replacePassword.validator,
  users.replacePassword.handler
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
