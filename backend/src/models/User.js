import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    mail: {
      /////////////////////////////////////key
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    nickname: {
      type: String,
      required: true,
    },
  },
  { versionKey: false }
);

const User = mongoose.model("User", UserSchema);

export default User;