import mongoose from "mongoose";

const HotProductSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
    },
    score: Number,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 60 * 60 * 24,
    },
  },
  { versionKey: false }
);

const HotProduct = mongoose.model("HotProduct", HotProductSchema, "hotProduct");

export default HotProduct;
