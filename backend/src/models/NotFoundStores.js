import mongoose from "mongoose";

const NotFoundStoresSchema = new mongoose.Schema(
  {
    cart_address: String,
    product_name: String,
    product_name: String,
    productId: {
      type: String,
      required: true,
      index: true,
    },
    last_updated: {
      type: Date,
      default: Date.now,
      expires: 60 * 60 * 24 * 3, // 3 days
    },
  },
  { versionKey: false }
);

const NotFoundStores = mongoose.model("NotFoundStores", NotFoundStoresSchema, "notFoundStores");
export default NotFoundStores;
