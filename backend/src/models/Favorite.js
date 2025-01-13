import mongoose from "mongoose";

const FavoriteSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId, // הפניה ל-Product
      ref: "Product",
      required: true,
    },
    mail: {
      type: String, // מזהה המשתמש
      required: true,
    },
  },
  { versionKey: false }
);

FavoriteSchema.index({ productId: 1, mail: 1 }, { unique: true });

const Favorite = mongoose.model("Favorite", FavoriteSchema);

export default Favorite;
