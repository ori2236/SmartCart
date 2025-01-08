import users from "../../controllers/users/index.js";
import { Router } from "express";

const router = Router();

router.post("/user", 
    users.post.validator,
    users.post.handler
);

router.get("/user/:id",
  users.get.validator, 
  users.get.handler
);

router.put("/user/:id",
  users.put.validator,
  users.put.handler
);

router.delete("/user/:id",
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


router.get("/temp", (req, res) => {
  res.json({
    message: "got",
  });
});

export default router;
