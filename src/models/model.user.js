import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import {
    USER_ROLES,
    USER_ROLE_VALUES,
} from "../constants/constant.roles.js";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: [2, "Name must contain at least 2 characters"],
            maxlength: [100, "Name cannot exceed 100 characters"],
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: [254, "Email cannot exceed 254 characters"],
        },

        passwordHash: {
            type: String,
            required: [true, "Password is required"],
            minlength: 8,
            select: false,
        },

        role: {
            type: String,
            enum: USER_ROLE_VALUES,
            default: USER_ROLES.MEMBER,
        },

        department: {
            type: String,
            trim: true,
            maxlength: 100,
            default: "",
        },

        jobTitle: {
            type: String,
            trim: true,
            maxlength: 100,
            default: "",
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        lastLoginAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        versionKey: false,

        toJSON: {
            transform: (_document, returnedObject) => {
                delete returnedObject.passwordHash;

                return returnedObject;
            },
        },
    }
);

userSchema.index({
    role: 1,
    isActive: 1,
});

userSchema.pre("save", async function () {
    if (!this.isModified("passwordHash")) {
        return;
    }

    this.passwordHash = await bcrypt.hash(
        this.passwordHash,
        12
    );
});

userSchema.methods.comparePassword = function (
    candidatePassword
) {
    return bcrypt.compare(
        candidatePassword,
        this.passwordHash
    );
};

const User = mongoose.model("User", userSchema);

export default User;