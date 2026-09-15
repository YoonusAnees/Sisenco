import mongoose from "mongoose";
import { AI_MESSAGE_ROLE_VALUES } from "../constants/constant.ai.js";

const aiMessageSchema = new mongoose.Schema(
    {
        role: {
            type: String,
            enum: {
                values: AI_MESSAGE_ROLE_VALUES,
                message: "Invalid AI message role",
            },
            required: true,
        },
        content: {
            type: String,
            required: [true, "Message content is required"],
            trim: true,
            maxlength: [20000, "Message content cannot exceed 20,000 characters"],
        },
        operation: {
            type: String,
            default: "chat",
        },
        structuredReport: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        _id: true,
        timestamps: false,
    }
);

const aiConversationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Conversation user owner is required"],
            index: true,
        },
        title: {
            type: String,
            trim: true,
            maxlength: [120, "Title cannot exceed 120 characters"],
            default: "New Chat",
        },
        messages: [aiMessageSchema],
        lastActivityAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
        expiresAt: {
            type: Date,
            index: {
                expires: 0,
            },
        },
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: {
            transform(document, returnedObject) {
                returnedObject.id = returnedObject._id.toString();
                delete returnedObject._id;
                return returnedObject;
            },
        },
    }
);

const AiConversation = mongoose.model(
    "AiConversation",
    aiConversationSchema
);

export default AiConversation;
