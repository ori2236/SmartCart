import mongoose from "mongoose";

const UserInCartSchema = new mongoose.Schema(
  {
    cartKey: {
      /////////////////////////////////////key
      type: String,
      required: true,
    },
    mail: {
      /////////////////////////////////////key
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
  },
  { versionKey: false }
);

UserInCartSchema.index({ cartKey: 1, mail: 1 }, { unique: true });

const UserInCart = mongoose.model("UserInCart", UserInCartSchema);

export default UserInCart;
