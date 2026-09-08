import {
  PROJECT_CATEGORIES,
  PROJECT_STATUSES,
} from "../../constants/constant.projects.js";

/**
 * Seed data array for projects.
 */
export const SEED_PROJECTS = [
  {
    name: "Customer Portal",
    code: "CUST-PORT",
    description: "Web application for customer account management, self-service ticketing, and billing analytics.",
    category: PROJECT_CATEGORIES.DEVELOPMENT,
    status: PROJECT_STATUSES.ACTIVE,
    managerEmail: "manager.engineering@weeklyreport.test",
    startDate: new Date("2026-01-15"),
    endDate: new Date("2026-12-31"),
  },
  {
    name: "Inventory Management",
    code: "INV-MGMT",
    description: "Real-time stock tracking system with automated reorder alerts and supplier integration.",
    category: PROJECT_CATEGORIES.DEVELOPMENT,
    status: PROJECT_STATUSES.ACTIVE,
    managerEmail: "manager.engineering@weeklyreport.test",
    startDate: new Date("2026-02-01"),
    endDate: new Date("2026-11-30"),
  },
  {
    name: "Mobile Reporting Application",
    code: "MOB-REP",
    description: "Cross-platform mobile application for field staff reporting and real-time dashboard viewing.",
    category: PROJECT_CATEGORIES.DESIGN,
    status: PROJECT_STATUSES.ACTIVE,
    managerEmail: "manager.product@weeklyreport.test",
    startDate: new Date("2026-03-01"),
    endDate: new Date("2026-10-31"),
  },
  {
    name: "Internal Analytics Platform",
    code: "INT-ANALYTICS",
    description: "Legacy business intelligence dashboard for internal executive reporting.",
    category: PROJECT_CATEGORIES.RESEARCH,
    status: PROJECT_STATUSES.INACTIVE,
    managerEmail: "manager.product@weeklyreport.test",
    startDate: new Date("2025-06-01"),
    endDate: new Date("2026-01-31"),
  },
];
