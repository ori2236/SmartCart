import WaitingList from "../../controllers/waitingList/index.js";
import { Router } from "express";

const router = Router();

router.post("/waitingList",
  WaitingList.post.validator,
  WaitingList.post.handler
);

router.get(
  "/waitingList/:type/:content",
  WaitingList.get.validator,
  WaitingList.get.handler
);

router.delete(
  "/waitingList/:mail/:cartKey",
  WaitingList.delete.validator,
  WaitingList.delete.handler
);

export default router;
