import mongoose from "mongoose";

import {
    REPORT_STATUSES,
} from "../constants/constant.reports.js";

const reportVersionSchema =
    new mongoose.Schema(
        {
            report: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "WeeklyReport",
                required: true,
                immutable: true,
                index: true,
            },

            owner: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
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

            /*
             * Indicates the report state immediately
             * before submission.
             */
            sourceStatus: {
                type: String,
                enum: [
                    REPORT_STATUSES.DRAFT,
                    REPORT_STATUSES.NEEDS_CORRECTION,
                ],
                required: true,
                immutable: true,
            },

            /*
             * Complete report content at submission time.
             * Mixed is appropriate because this is a
             * historical snapshot, not editable data.
             */
            snapshot: {
                type: mongoose.Schema.Types.Mixed,
                required: true,
                immutable: true,
            },

            submittedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
                immutable: true,
            },

            submittedAt: {
                type: Date,
                required: true,
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

/*
 * A report cannot contain the same version
 * number more than once.
 */
reportVersionSchema.index(
    {
        report: 1,
        versionNumber: 1,
    },
    {
        unique: true,
    }
);

/*
 * Useful when loading a user's versions.
 */
reportVersionSchema.index({
    owner: 1,
    submittedAt: -1,
});

const ReportVersion = mongoose.model(
    "ReportVersion",
    reportVersionSchema
);

export default ReportVersion;