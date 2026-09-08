import { jest } from "@jest/globals";
import { resetDatabase } from "../../seed/resetDatabase.js";
import { runSeed } from "../../seed/seedDatabase.js";
import User from "../../models/model.user.js";

describe("Seed & Reset Database System Unit Tests", () => {
  it("prevents database reset when NODE_ENV is production", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    process.env.ALLOW_DATABASE_RESET = "true";

    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {});

    await resetDatabase();

    expect(mockExit).toHaveBeenCalledWith(1);

    mockExit.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });

  it("prevents database reset when ALLOW_DATABASE_RESET is not true", async () => {
    const originalReset = process.env.ALLOW_DATABASE_RESET;
    delete process.env.ALLOW_DATABASE_RESET;

    const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {});

    await resetDatabase();

    expect(mockExit).toHaveBeenCalledWith(1);

    mockExit.mockRestore();
    process.env.ALLOW_DATABASE_RESET = originalReset;
  });

  it("seeds database and produces consistent record counts", async () => {
    await runSeed();
    const count1 = await User.countDocuments();
    expect(count1).toBe(9);

    // Second run must be idempotent
    await runSeed();
    const count2 = await User.countDocuments();
    expect(count2).toBe(9);
  });
});
