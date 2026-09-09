import mongoose from "mongoose";

/**
 * Executes an operation inside a MongoDB transaction if supported (e.g. replica set),
 * or directly without a transaction if running on standalone MongoDB.
 */
export const runTransaction = async (operation) => {
  let session = null;
  try {
    session = await mongoose.startSession();
    let result;
    await session.withTransaction(async () => {
      result = await operation(session);
    });
    return result;
  } catch (error) {
    // If standalone MongoDB doesn't support transactions (code 20 / IllegalOperation)
    if (
      error?.code === 20 ||
      error?.codeName === "IllegalOperation" ||
      error?.errorResponse?.code === 20 ||
      error?.errorResponse?.codeName === "IllegalOperation" ||
      (typeof error?.message === "string" &&
        error.message.includes("replica set"))
    ) {
      return await operation(null);
    }
    throw error;
  } finally {
    if (session) {
      try {
        await session.endSession();
      } catch {
        // ignore endSession error if already ended
      }
    }
  }
};