import mongoose from "mongoose";

import {
    REVIEW_ACTION_VALUES,
} from "../constants/constant.reviews.js";

const reviewSchema = new mongoose.Schema(
    {
        report: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "WeeklyReport",
            required: true,
            immutable: true,
            index: true,
        },

        /*
         * Exact immutable version reviewed by
         * the manager.
         */
        version: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ReportVersion",
            required: true,
            immutable: true,
            index: true,
        },

        versionNumber: {
            type: Number,
            required: true,
            min: 1,
            immutable: true,
        },

        reviewer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            immutable: true,
            index: true,
        },

        action: {
            type: String,
            enum: {
                values: REVIEW_ACTION_VALUES,
                message: "Invalid review action",
            },
            required: true,
            immutable: true,
            index: true,
        },

        comment: {
            type: String,
            trim: true,
            maxlength: [
                2000,
                "Review comment cannot exceed 2000 characters",
            ],
            default: "",
            immutable: true,
        },

        reviewedAt: {
            type: Date,
            required: true,
            default: Date.now,
            immutable: true,
        },
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: false,
        },

        versionKey: false,

        toJSON: {
            transform(document, returnedObject) {
                returnedObject.id =
                    returnedObject._id.toString();

                delete returnedObject._id;

                return returnedObject;
            },
        },
    }
);

reviewSchema.index({
    report: 1,
    reviewedAt: -1,
});

reviewSchema.index({
    version: 1,
    action: 1,
});

const Review = mongoose.model(
    "Review",
    reviewSchema
);

export default Review;