import mongoose from "mongoose";

const RejectedProductsSchema = new mongoose.Schema(
  {
    cartKey: {
      /////////////////////////////////////key
      type: String,
      required: true,
    },
    productId: {
      /////////////////////////////////////key
      type: String,
      required: true,
    },
    rejectedBy: {
      /////////////////////////////////////key
      type: String,
      required: true,
    },
    createdAt: {
      /////////////////////////////////////key
      type: Date,
      default: Date.now,
    },
  },
  { versionKey: false }
);

RejectedProductsSchema.index(
  { cartKey: 1, productId: 1, rejectedBy: 1, createdAt: 1 },
  { unique: true }
);

const RejectedProducts = mongoose.model(
  "RejectedProducts",
  RejectedProductsSchema,
  "rejectedProducts"
);

export default RejectedProducts;