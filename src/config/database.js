import mongoose from "mongoose";
import { env } from "./environment.js";

export const connectDatabase = async () => {
    await mongoose.connect(env.mongoUri);

    console.log("MongoDB connected successfully");
};

export const disconnectDatabase = async () => {
    await mongoose.disconnect();
};