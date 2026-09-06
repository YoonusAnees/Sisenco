import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import projectRoutes from "./project.routes.js";
import reportRoutes from "./report.routes.js";
import reviewRoutes from "./review.routes.js";
import dashboardRoutes from "./dashboard.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/projects", projectRoutes);
router.use("/reports", reportRoutes);
router.use("/reviews", reviewRoutes);
router.use("/dashboard", dashboardRoutes);





export default router;