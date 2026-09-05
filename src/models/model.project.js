import mongoose from "mongoose";

import {
    PROJECT_CATEGORIES,
    PROJECT_CATEGORY_VALUES,
    PROJECT_STATUSES,
    PROJECT_STATUS_VALUES,
} from "../constants/constant.projects.js";

const projectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Project name is required"],
            trim: true,
            minlength: [2, "Project name is too short"],
            maxlength: [
                150,
                "Project name cannot exceed 150 characters",
            ],
        },

        code: {
            type: String,
            required: [true, "Project code is required"],
            unique: true,
            trim: true,
            uppercase: true,
            minlength: [2, "Project code is too short"],
            maxlength: [
                20,
                "Project code cannot exceed 20 characters",
            ],
            match: [
                /^[A-Z0-9-]+$/,
                "Project code may only contain letters, numbers and hyphens",
            ],
        },

        description: {
            type: String,
            trim: true,
            maxlength: [
                2000,
                "Description cannot exceed 2000 characters",
            ],
            default: "",
        },

        category: {
            type: String,
            enum: {
                values: PROJECT_CATEGORY_VALUES,
                message: "Invalid project category",
            },
            default: PROJECT_CATEGORIES.OTHER,
        },

        status: {
            type: String,
            enum: {
                values: PROJECT_STATUS_VALUES,
                message: "Invalid project status",
            },
            default: PROJECT_STATUSES.ACTIVE,
            index: true,
        },

        manager: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true,
        },

        startDate: {
            type: Date,
            default: null,
        },

        endDate: {
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
            default: null,
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
 * Improve filtering and sorting.
 */
projectSchema.index({
    category: 1,
    status: 1,
    createdAt: -1,
});

/*
 * Improve project-name searching.
 */
projectSchema.index({
    name: "text",
    code: "text",
});

/*
 * Validate the project date range.
 */
projectSchema.pre(
  "validate",
  function validateDates() {
    if (
      this.startDate &&
      this.endDate &&
      this.endDate < this.startDate
    ) {
      this.invalidate(
        "endDate",
        "End date cannot be earlier than start date"
      );
    }
  }
);

const Project = mongoose.model(
    "Project",
    projectSchema
);

export default Project;