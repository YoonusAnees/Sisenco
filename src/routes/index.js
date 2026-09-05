import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import projectRoutes from "./project.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/projects", projectRoutes);



export default router;