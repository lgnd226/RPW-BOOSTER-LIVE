import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import fbRouter from "./fb.js";
import releasesRouter from "./releases.js";
import statusRouter from "./status.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(statusRouter);
router.use("/fb", fbRouter);
router.use("/releases", releasesRouter);

export default router;
