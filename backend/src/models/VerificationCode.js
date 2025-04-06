import mongoose from "mongoose";

const VerificationCodeSchema = new mongoose.Schema(
  {
    mail: {
      type: String,
      required: true,
      unique: true,
    },

    code: {
      type: Number,
      required: true,
    },
    hashedPassword: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600,
    },
    nickname: {
      type: String,
      required: true,
    },
  },
  { versionKey: false }
);

const VerificationCode = mongoose.model(
  "VerificationCode",
  VerificationCodeSchema
);

export default VerificationCode;
