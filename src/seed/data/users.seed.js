import { USER_ROLES } from "../../constants/constant.roles.js";

/**
 * Seed data array for application users.
 */
export const SEED_USERS = [
  {
    name: "System Administrator",
    email: "admin@weeklyreport.test",
    role: USER_ROLES.ADMIN,
    department: "Administration",
    jobTitle: "System Administrator",
    isActive: true,
  },
  {
    name: "Engineering Manager",
    email: "manager.engineering@weeklyreport.test",
    role: USER_ROLES.MANAGER,
    department: "Engineering",
    jobTitle: "Engineering Manager",
    isActive: true,
  },
  {
    name: "Product Manager",
    email: "manager.product@weeklyreport.test",
    role: USER_ROLES.MANAGER,
    department: "Product",
    jobTitle: "Product Manager",
    isActive: true,
  },
  {
    name: "Member One",
    email: "member.one@weeklyreport.test",
    role: USER_ROLES.MEMBER,
    department: "Engineering",
    jobTitle: "Senior Software Engineer",
    isActive: true,
  },
  {
    name: "Member Two",
    email: "member.two@weeklyreport.test",
    role: USER_ROLES.MEMBER,
    department: "Engineering",
    jobTitle: "Frontend Developer",
    isActive: true,
  },
  {
    name: "Member Three",
    email: "member.three@weeklyreport.test",
    role: USER_ROLES.MEMBER,
    department: "Engineering",
    jobTitle: "Backend Developer",
    isActive: true,
  },
  {
    name: "Member Four",
    email: "member.four@weeklyreport.test",
    role: USER_ROLES.MEMBER,
    department: "Product",
    jobTitle: "UI/UX Designer",
    isActive: true,
  },
  {
    name: "Member Five",
    email: "member.five@weeklyreport.test",
    role: USER_ROLES.MEMBER,
    department: "Quality Assurance",
    jobTitle: "QA Engineer",
    isActive: true,
  },
  {
    name: "Inactive Member",
    email: "inactive.member@weeklyreport.test",
    role: USER_ROLES.MEMBER,
    department: "Engineering",
    jobTitle: "Former Software Engineer",
    isActive: false,
  },
];
