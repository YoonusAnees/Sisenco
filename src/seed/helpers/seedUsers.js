import User from "../../models/model.user.js";
import { SEED_USERS } from "../data/users.seed.js";

/**
 * Seeds or updates application users in an idempotent manner.
 *
 * @returns {Promise<{ userMap: Map<string, object>, count: number }>}
 */
export const seedUsers = async () => {
  const seedPassword = process.env.SEED_USER_PASSWORD || "Password123";
  const userMap = new Map();
  let count = 0;

  for (const userData of SEED_USERS) {
    let user = await User.findOne({ email: userData.email.toLowerCase() });

    if (user) {
      user.name = userData.name;
      user.role = userData.role;
      user.department = userData.department;
      user.jobTitle = userData.jobTitle;
      user.isActive = userData.isActive;
      await user.save();
    } else {
      user = new User({
        ...userData,
        passwordHash: seedPassword, // Pre-save hook will hash this password
      });
      await user.save();
    }

    userMap.set(user.email, user);
    count++;
  }

  return { userMap, count };
};
