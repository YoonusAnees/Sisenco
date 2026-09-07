import mongoose from "mongoose";

import {
  NOTIFICATION_TYPE_VALUES,
} from "../constants/constant.notification.js";

const notificationSchema =
  new mongoose.Schema(
    {
      recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        immutable: true,
        index: true,
      },

      actor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
        immutable: true,
      },

      type: {
        type: String,
        enum: {
          values:
            NOTIFICATION_TYPE_VALUES,
          message:
            "Invalid notification type",
        },
        required: true,
        immutable: true,
        index: true,
      },

      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
        immutable: true,
      },

      message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000,
        immutable: true,
      },

      report: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "WeeklyReport",
        default: null,
        immutable: true,
        index: true,
      },

      review: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
        default: null,
        immutable: true,
      },

      isRead: {
        type: Boolean,
        default: false,
        index: true,
      },

      readAt: {
        type: Date,
        default: null,
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

notificationSchema.index({
  recipient: 1,
  isRead: 1,
  createdAt: -1,
});

notificationSchema.index({
  recipient: 1,
  type: 1,
  createdAt: -1,
});

const Notification = mongoose.model(
  "Notification",
  notificationSchema
);

export default Notification;