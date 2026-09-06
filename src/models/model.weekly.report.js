import mongoose from "mongoose";

import {
    HOURS_CATEGORY_VALUES,
    REPORT_STATUSES,
    REPORT_STATUS_VALUES,
    TASK_PRIORITIES,
    TASK_PRIORITY_VALUES,
} from "../constants/constant.reports.js";

const completedTaskSchema =
    new mongoose.Schema(
        {
            title: {
                type: String,
                required: [
                    true,
                    "Completed task title is required",
                ],
                trim: true,
                maxlength: [
                    200,
                    "Task title cannot exceed 200 characters",
                ],
            },

            description: {
                type: String,
                trim: true,
                maxlength: [
                    2000,
                    "Task description cannot exceed 2000 characters",
                ],
                default: "",
            },

            project: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Project",
                required: [
                    true,
                    "Completed task project is required",
                ],
            },

            hoursSpent: {
                type: Number,
                required: true,
                min: [
                    0,
                    "Hours spent cannot be negative",
                ],
                max: [
                    168,
                    "Hours spent cannot exceed 168",
                ],
            },

            completedAt: {
                type: Date,
                default: null,
            },
        },
        {
            _id: true,
            timestamps: false,
        }
    );

const nextWeekTaskSchema =
    new mongoose.Schema(
        {
            title: {
                type: String,
                required: [
                    true,
                    "Next-week task title is required",
                ],
                trim: true,
                maxlength: [
                    200,
                    "Task title cannot exceed 200 characters",
                ],
            },

            description: {
                type: String,
                trim: true,
                maxlength: [
                    2000,
                    "Task description cannot exceed 2000 characters",
                ],
                default: "",
            },

            project: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Project",
                required: [
                    true,
                    "Next-week task project is required",
                ],
            },

            priority: {
                type: String,
                enum: {
                    values: TASK_PRIORITY_VALUES,
                    message: "Invalid task priority",
                },
                default: TASK_PRIORITIES.MEDIUM,
            },

            dueDate: {
                type: Date,
                default: null,
            },
        },
        {
            _id: true,
            timestamps: false,
        }
    );

const blockerSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [
                true,
                "Blocker title is required",
            ],
            trim: true,
            maxlength: [
                200,
                "Blocker title cannot exceed 200 characters",
            ],
        },

        description: {
            type: String,
            required: [
                true,
                "Blocker description is required",
            ],
            trim: true,
            maxlength: [
                2000,
                "Blocker description cannot exceed 2000 characters",
            ],
        },

        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: [
                true,
                "Blocker project is required",
            ],
        },

        impact: {
            type: String,
            trim: true,
            maxlength: [
                1000,
                "Blocker impact cannot exceed 1000 characters",
            ],
            default: "",
        },

        assistanceNeeded: {
            type: String,
            trim: true,
            maxlength: [
                1000,
                "Assistance-needed text cannot exceed 1000 characters",
            ],
            default: "",
        },

        isResolved: {
            type: Boolean,
            default: false,
        },
    },
    {
        _id: true,
        timestamps: false,
    }
);

const achievementSchema =
    new mongoose.Schema(
        {
            title: {
                type: String,
                required: [
                    true,
                    "Achievement title is required",
                ],
                trim: true,
                maxlength: [
                    200,
                    "Achievement title cannot exceed 200 characters",
                ],
            },

            description: {
                type: String,
                trim: true,
                maxlength: [
                    2000,
                    "Achievement description cannot exceed 2000 characters",
                ],
                default: "",
            },

            project: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Project",
                default: null,
            },
        },
        {
            _id: true,
            timestamps: false,
        }
    );

const hoursBreakdownSchema =
    new mongoose.Schema(
        {
            project: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Project",
                required: [
                    true,
                    "Hours project is required",
                ],
            },

            category: {
                type: String,
                enum: {
                    values: HOURS_CATEGORY_VALUES,
                    message: "Invalid hours category",
                },
                required: true,
            },

            hours: {
                type: Number,
                required: true,
                min: [
                    0,
                    "Hours cannot be negative",
                ],
                max: [
                    168,
                    "Hours cannot exceed 168",
                ],
            },

            notes: {
                type: String,
                trim: true,
                maxlength: [
                    500,
                    "Hours notes cannot exceed 500 characters",
                ],
                default: "",
            },
        },
        {
            _id: true,
            timestamps: false,
        }
    );

const linkSchema = new mongoose.Schema(
    {
        label: {
            type: String,
            required: [
                true,
                "Link label is required",
            ],
            trim: true,
            maxlength: [
                100,
                "Link label cannot exceed 100 characters",
            ],
        },

        url: {
            type: String,
            required: [
                true,
                "Link URL is required",
            ],
            trim: true,
            maxlength: [
                2000,
                "Link URL cannot exceed 2000 characters",
            ],
        },
    },
    {
        _id: true,
        timestamps: false,
    }
);

const weeklyReportSchema =
    new mongoose.Schema(
        {
            owner: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
                immutable: true,
                index: true,
            },

            weekStart: {
                type: Date,
                required: [
                    true,
                    "Reporting week start date is required",
                ],
                immutable: true,
                index: true,
            },

            weekEnd: {
                type: Date,
                required: true,
                immutable: true,
            },

            summary: {
                type: String,
                trim: true,
                maxlength: [
                    3000,
                    "Summary cannot exceed 3000 characters",
                ],
                default: "",
            },

            completedTasks: {
                type: [completedTaskSchema],
                default: [],
            },

            nextWeekTasks: {
                type: [nextWeekTaskSchema],
                default: [],
            },

            blockers: {
                type: [blockerSchema],
                default: [],
            },

            achievements: {
                type: [achievementSchema],
                default: [],
            },

            hoursBreakdown: {
                type: [hoursBreakdownSchema],
                default: [],
            },

            links: {
                type: [linkSchema],
                default: [],
            },

            totalHours: {
                type: Number,
                min: 0,
                max: 168,
                default: 0,
            },

            status: {
                type: String,
                enum: {
                    values: REPORT_STATUS_VALUES,
                    message: "Invalid report status",
                },
                default: REPORT_STATUSES.DRAFT,
                index: true,
            },

            submittedAt: {
                type: Date,
                default: null,
            },

            approvedAt: {
                type: Date,
                default: null,
            },

            createdBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
                immutable: true,
            },

            updatedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        },
        {
            timestamps: true,
            versionKey: false,
            toJSON: {
                virtuals: true,

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
 * One user can create only one report
 * for the same week.
 */
weeklyReportSchema.index(
    {
        owner: 1,
        weekStart: 1,
    },
    {
        unique: true,
    }
);

/*
 * Useful for report list queries.
 */
weeklyReportSchema.index({
    owner: 1,
    status: 1,
    weekStart: -1,
});

/*
 * Calculate total hours before validation.
 */
weeklyReportSchema.pre(
    "validate",
    function calculateTotalHours() {
        this.totalHours = this.hoursBreakdown.reduce(
            (total, entry) => {
                return total + entry.hours;
            },
            0
        );

        /*
         * Avoid floating-point results such as
         * 39.999999999.
         */
        this.totalHours =
            Math.round(this.totalHours * 100) / 100;

        if (this.totalHours > 168) {
            this.invalidate(
                "totalHours",
                "Total weekly hours cannot exceed 168"
            );
        }
    }
);

const WeeklyReport = mongoose.model(
    "WeeklyReport",
    weeklyReportSchema
);

export default WeeklyReport;