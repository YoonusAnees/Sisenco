import mongoose from "mongoose";

import {
  PROJECT_MEMBER_ROLES,
  PROJECT_MEMBER_ROLE_VALUES,
} from "../constants/constant.projects.js";

const projectMemberSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    projectRole: {
      type: String,
      enum: {
        values: PROJECT_MEMBER_ROLE_VALUES,
        message: "Invalid project member role",
      },
      default: PROJECT_MEMBER_ROLES.MEMBER,
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
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
 * The same user cannot be assigned to the
 * same project more than once.
 */
projectMemberSchema.index(
  {
    project: 1,
    user: 1,
  },
  {
    unique: true,
  }
);

const ProjectMember = mongoose.model(
  "ProjectMember",
  projectMemberSchema
);

export default ProjectMember;