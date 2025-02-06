import mongoose from "mongoose";

const FavoriteSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      ref: "Product",
      required: true,
    },
    mail: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
  },
  { versionKey: false }
);

FavoriteSchema.index({ productId: 1, mail: 1 }, { unique: true });

const Favorite = mongoose.model("Favorite", FavoriteSchema);

export default Favorite;
