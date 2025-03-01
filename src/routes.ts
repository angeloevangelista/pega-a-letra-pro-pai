import { Router } from "express";

import healthCheckHandler from "./handlers/health-check";
import getLyricsHandler from "./handlers/get-lyrics";

const router = Router();

router.get("/api/health", healthCheckHandler)
router.get("/api/lyrics", getLyricsHandler)

export default router;
