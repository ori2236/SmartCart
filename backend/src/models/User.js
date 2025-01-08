import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
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
    is_Google: {
      type: Boolean,
      required: true,
    },
  }, { versionKey: false }
);

const User = mongoose.model("User", UserSchema);

export default User;